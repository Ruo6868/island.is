import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from 'react-use'
import type { FieldExtensionSDK } from '@contentful/app-sdk'
import { useSDK } from '@contentful/react-apps-toolkit'

import { AddNodeButton } from './AddNodeButton'
import { EntryContext, useEntryContext } from './entryContext'
import { SitemapNode } from './SitemapNode'
import {
  addNode as addNodeUtil,
  findNodes,
  removeNode as removeNodeUtil,
  type Tree,
  TreeNode,
  TreeNodeType,
  updateNode as updateNodeUtil,
} from './utils'
import * as styles from './SitemapTreeField.css'

const DEBOUNCE_TIME = 100

export const SitemapTreeField = () => {
  const sdk = useSDK<FieldExtensionSDK>()
  const [tree, setTree] = useState<Tree | undefined>(
    sdk.field.getValue() || {
      id: 0,
      childNodes: [],
    },
  )

  useDebounce(
    () => {
      sdk.field.setValue(tree)
    },
    DEBOUNCE_TIME,
    [tree],
  )

  useEffect(() => {
    sdk.window.startAutoResizer()
    return () => {
      sdk.window.stopAutoResizer()
    }
  }, [sdk.window, tree.childNodes.length])

  const addNode = useCallback(
    async (parentNode: Tree, type: TreeNodeType, createNew?: boolean) => {
      await addNodeUtil(parentNode, type, sdk, tree, createNew)
      setTree((prevTree) => ({
        ...prevTree,
      }))
    },
    [sdk, tree],
  )

  const removeNode = useCallback(
    (parentNode: Tree, idOfNodeToRemove: number) => {
      removeNodeUtil(parentNode, idOfNodeToRemove, tree)
      setTree((prevTree) => ({ ...prevTree }))
    },
    [tree],
  )

  const updateNode = useCallback((parentNode: Tree, updatedNode: TreeNode) => {
    updateNodeUtil(parentNode, updatedNode)
    setTree((prevTree) => ({ ...prevTree }))
  }, [])

  const onMarkEntryAsPrimary = useCallback(
    (nodeId: number, entryId: string) => {
      const nodes = findNodes(
        tree,
        (otherNode) =>
          otherNode.type === TreeNodeType.ENTRY && otherNode.entryId == entryId,
      )
      for (const node of nodes) {
        if (node.type === TreeNodeType.ENTRY) {
          node.primaryLocation = node.id === nodeId
        }
      }
      setTree((prevTree) => ({ ...prevTree }))
    },
    [tree],
  )

  return (
    <EntryContext.Provider value={useEntryContext()}>
      <div>
        <div>
          <div className={styles.childNodeContainer}>
            {tree.childNodes.map((node) => (
              <SitemapNode
                parentNode={tree}
                removeNode={removeNode}
                addNode={addNode}
                updateNode={updateNode}
                key={node.id}
                node={node}
                root={tree}
                onMarkEntryAsPrimary={onMarkEntryAsPrimary}
              />
            ))}
            <div className={styles.addNodeButtonContainer}>
              <AddNodeButton
                addNode={(type, createNew) => {
                  addNode(tree, type, createNew)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </EntryContext.Provider>
  )
}
