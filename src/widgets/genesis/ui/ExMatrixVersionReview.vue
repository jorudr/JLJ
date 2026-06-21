<template>
  <Teleport to="body">
    <Transition name="version-review-fade">
      <div
        v-if="isOpen"
        class="version-review-theme fixed inset-0 z-[100002] flex items-center justify-center p-8 backdrop-blur-[2px]"
        :class="isDark ? 'is-dark dark theme-dark bg-black/45' : 'theme-light bg-black/20'"
        @click="$emit('close')"
      >
        <div class="relative h-[82vh] w-full max-w-6xl" @click.stop>
          <button
            type="button"
            class="absolute -right-6 top-1/2 z-[100] flex h-40 w-6 -translate-y-1/2 cursor-pointer items-center justify-center border-y border-r border-black/20 bg-theme-bg transition-colors hover:bg-theme-surface dark:border-white/20 dark:bg-[#070707] dark:hover:bg-[#111] group/close-tab"
            aria-label="Close version review"
            @click="$emit('close')"
          >
            <div class="h-16 w-px bg-black/10 transition-all duration-300 group-hover/close-tab:bg-black/40 dark:bg-white/10 dark:group-hover/close-tab:bg-white/40"></div>
            <span class="absolute rotate-90 whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.4em] text-black/10 transition-colors group-hover/close-tab:text-black/40 dark:text-white/10 dark:group-hover/close-tab:text-white/40">
              Close_Review
            </span>
          </button>

          <ExPanel variant="light" :show-corners="true" :no-padding="true" class="version-review-panel h-full w-full">
            <div class="flex h-full min-h-0 flex-col text-nier-text-light dark:text-nier-text-dark">
              <header class="h-6 shrink-0 border-b border-black/10 dark:border-white/10"></header>

              <div class="version-review-scroll min-h-0 flex-1 overflow-y-auto px-20 py-12">
                <div v-if="reviewVersions.length" class="flex flex-col gap-12">
                  <article
                    v-for="version in reviewVersions"
                    :key="version.id"
                    class="version-diff overflow-hidden border border-black/15 dark:border-white/15"
                  >
                    <div class="flex items-center justify-between px-10 py-5">
                      <div class="min-w-0">
                        <div class="flex items-center gap-3">
                          <Icon name="lucide:git-commit-horizontal" class="h-4 w-4 shrink-0 opacity-55" />
                          <span class="diff-version-title truncate font-mono text-[14px] font-black uppercase tracking-[0.18em]">{{ getVersionTitle(version) }}</span>
                        </div>
                        <div class="mt-1 pl-7 font-mono text-[10px] uppercase tracking-[0.16em] opacity-35">
                          {{ formatTimestamp(version.updatedAt) }}
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-4 font-mono text-[11px] font-black">
                        <span class="diff-marker-added">+{{ version.added }}</span>
                        <span class="diff-marker-removed">-{{ version.removed }}</span>
                        <span class="diff-marker-modified">~{{ version.modified }}</span>
                      </div>
                    </div>

                    <div v-if="version.changes.length" class="font-mono text-[13px] leading-6">
                      <div
                        v-for="change in visibleVersionChanges(version)"
                        :key="change.key"
                        class="version-diff-row grid grid-cols-[38px_minmax(0,1fr)]"
                        :class="`diff-row-${change.kind}`"
                      >
                        <div
                          class="flex justify-center border-r border-black/10 py-4 font-black dark:border-white/10"
                          :class="`diff-marker-${change.kind}`"
                        >
                          {{ change.marker }}
                        </div>
                        <div class="min-w-0 px-10 py-4">
                          <div v-if="change.title.startsWith('ADD_NODE') && change.nodeObject" class="mt-3 mb-2">
                             <div class="flex items-center gap-4 p-4 border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] relative overflow-hidden group/preview shadow-inner">
                               <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(150,150,150,0.05)_25%,rgba(150,150,150,0.05)_50%,transparent_50%,transparent_75%,rgba(150,150,150,0.05)_75%,rgba(150,150,150,0.05)_100%)] bg-[length:10px_10px] opacity-50 pointer-events-none"></div>
                               <!-- Fake terminal brackets -->
                               <div class="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-black/20 dark:border-white/20"></div>
                               <div class="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-black/20 dark:border-white/20"></div>

                               <div class="w-16 h-20 relative shrink-0 ml-1">
                                 <ExSkillNode
                                   :node="change.nodeObject"
                                   :scale="0.45"
                                   :is-dark="isDark"
                                   :is-preview="true"
                                   :style="`position: absolute !important; left: 50% !important; top: ${change.nodeObject.params?.customName ? '38%' : '50%'} !important; transform: translate(-50%, -50%) !important;`"
                                 />
                               </div>
                               <div class="flex flex-col gap-0.5 relative z-10 flex-1 min-w-0">
                                 <span class="font-mono text-[10px] tracking-widest uppercase font-black" :class="`diff-marker-${change.kind}`">
                                   [+] REIFIED_NODE
                                 </span>
                                 <div class="flex items-baseline gap-2">
                                    <span class="diff-node-type shrink-0 text-[11px]">{{ change.nodeType }}</span>
                                    <span v-if="change.nodeName" class="diff-node-name min-w-0 truncate text-[11px]">{{ change.nodeName }}</span>
                                 </div>
                                 <span class="font-mono text-[7px] tracking-[0.2em] uppercase opacity-40 mt-0.5">System Object Initialized</span>
                               </div>
                             </div>
                          </div>
                          <div v-else class="flex min-w-0 items-baseline gap-2">
                            <span class="shrink-0 font-bold" :class="`diff-event-${change.tone}`">{{ change.title }}</span>
                            <span class="opacity-25">::</span>
                            <span class="diff-node-type shrink-0">{{ change.nodeType }}</span>
                            <span v-if="change.nodeName" class="diff-node-name min-w-0 truncate">{{ change.nodeName }}</span>
                            <span
                              v-if="change.kind !== 'unchanged'"
                              class="ml-auto shrink-0 font-mono text-[9px] font-black uppercase tracking-[0.2em]"
                              :class="`diff-marker-${change.kind}`"
                            >
                              {{ changeStatus(change.kind) }}
                            </span>
                          </div>
                          <template v-if="change.details.filter(d => !(change.title.startsWith('ADD_NODE') && d.label === 'type')).length">
                            <div class="mt-1.5 space-y-0.5">
                              <div
                                v-for="detail in change.details.filter(d => !(change.title.startsWith('ADD_NODE') && d.label === 'type'))"
                                :key="detail.key"
                              class="grid grid-cols-[58px_minmax(0,1fr)] break-words"
                              :class="{ 'diff-detail-removed': detail.kind === 'removed' }"
                            >
                              <span
                                class="text-[9px] font-black uppercase tracking-[0.12em]"
                                :class="`diff-marker-${detail.kind}`"
                              >
                                {{ detailStatus(detail) }}
                              </span>
                              <span :style="{ paddingLeft: `${detail.depth * 14}px` }">
                                <span class="diff-tree-glyph">{{ detail.depth ? '`- ' : '|- ' }}</span>
                                <span class="diff-detail-key">{{ detail.label }}</span>
                                <span class="diff-tree-glyph">: </span>
                                <span class="diff-detail-value">{{ detail.value }}</span>
                              </span>
                            </div>
                            </div>
                          </template>
                        </div>
                      </div>

                      <button
                        v-if="version.changes.length > 2"
                        type="button"
                        class="version-expand-button flex w-full items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] opacity-55 transition-opacity hover:opacity-100"
                        :aria-expanded="isVersionExpanded(version.id)"
                        @click="toggleVersion(version.id)"
                      >
                        <Icon
                          :name="isVersionExpanded(version.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                          class="h-3.5 w-3.5"
                        />
                        {{ isVersionExpanded(version.id) ? 'Collapse version' : `Show ${version.changes.length - 2} more events` }}
                      </button>
                    </div>

                    <div v-else class="px-6 py-8 text-center font-mono text-[11px] uppercase tracking-[0.24em] opacity-30">
                      No tree changes from previous version
                    </div>
                  </article>
                </div>

                <div v-else class="flex h-full items-center justify-center font-mono text-[9px] uppercase tracking-[0.3em] opacity-30">
                  No saved versions
                </div>
              </div>
            </div>
          </ExPanel>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ExPanel from '@/shared/ui/ExPanel.vue'
import ExSkillNode from './ExSkillNode.vue'
import { useThemeStore } from '~/features/store/useTheme'
import type { MatrixStrategyVersion } from '../model/matrix/useMatrixState'
import type { MatrixChangeEvent, MatrixChangeType } from '../model/matrix/useMatrixChangeTree'

const props = defineProps<{
  isOpen: boolean
  versions: MatrixStrategyVersion[]
}>()

defineEmits<{
  close: []
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.settings.isDark)
const expandedVersions = ref(new Set<string>())

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    expandedVersions.value = new Set()
  }
})

type ReviewChange = {
  key: string
  kind: 'added' | 'removed' | 'modified' | 'unchanged'
  marker: '+' | '-' | '~' | ''
  tone: 'add' | 'delete' | 'connect' | 'current'
  title: string
  nodeType: string
  nodeName: string
  details: ReviewDetail[]
  nodeObject?: any
}

type ReviewKind = ReviewChange['kind']

type ReviewDetail = {
  key: string
  kind: ReviewKind
  marker: '+' | '-' | '~' | ''
  label: string
  value: string
  depth: number
}

type FlatSubchange = {
  id: string
  label: string
  value: string
  depth: number
  order: number
}

function isVersionExpanded(versionId: string) {
  return expandedVersions.value.has(versionId)
}

function toggleVersion(versionId: string) {
  const next = new Set(expandedVersions.value)
  if (next.has(versionId)) next.delete(versionId)
  else next.add(versionId)
  expandedVersions.value = next
}

function getVersionTitle(version: any) {
  const strategyNode = (version.snapshot?.nodes || []).find((n: any) => n.type === 'strategy')
  const identity = strategyNode?.params?.identity || strategyNode?.params?.customName || strategyNode?.params?.identityName
  if (identity) {
    const versionMatch = version.label.match(/(V\d+)$/i)
    const suffix = versionMatch ? ` ${versionMatch[1]}` : ''
    return `${identity}${suffix}`
  }
  return version.label
}

function visibleVersionChanges(version: { id: string; changes: ReviewChange[] }) {
  if (version.changes.length <= 2 || isVersionExpanded(version.id)) return version.changes

  return version.changes.slice(0, 2)
}

function changeStatus(kind: ReviewKind) {
  if (kind === 'added') return 'NEW'
  if (kind === 'removed') return 'REMOVED'
  if (kind === 'modified') return 'CHANGED'
  return ''
}

function detailStatus(detail: ReviewDetail) {
  if (detail.kind === 'added') return '+ NEW'
  if (detail.kind === 'removed') return '- OLD'
  if (detail.kind === 'modified') return '~ NEW'
  return ''
}

const eventKinds: Record<Exclude<MatrixChangeType, 'version'>, Exclude<ReviewKind, 'unchanged'>> = {
  add: 'added',
  delete: 'removed',
  connect: 'modified',
  clear: 'removed',
  update: 'modified'
}

const markers: Record<ReviewKind, ReviewChange['marker']> = {
  added: '+',
  removed: '-',
  modified: '~',
  unchanged: ''
}

const eventTones: Record<Exclude<MatrixChangeType, 'version'>, ReviewChange['tone']> = {
  add: 'add',
  delete: 'delete',
  connect: 'connect',
  clear: 'delete',
  update: 'current'
}

function treeEvents(version?: MatrixStrategyVersion) {
  return (version?.snapshot.events || []).filter(
    (event: MatrixChangeEvent) => event.type !== 'version'
  ) as MatrixChangeEvent[]
}

function eventComparable(event: MatrixChangeEvent) {
  return {
    type: event.type,
    title: event.title,
    node: event.node,
    targetId: event.targetId,
    targetKind: event.targetKind,
    subchanges: event.subchanges || []
  }
}

function splitNode(node: string) {
  const separator = node.indexOf(':')
  if (separator === -1) return { nodeType: node, nodeName: '' }
  return {
    nodeType: node.slice(0, separator + 1),
    nodeName: node.slice(separator + 1).trim()
  }
}

function formatTreeValue(label: string, value: unknown) {
  if (label === 'table') return 'table change'
  if (label === 'screenshot') return 'screenshot change'
  if (label === 'drawing_panel') return 'drawing_panel change'
  if (label === 'file_attachment') return 'file_attachment change'
  const flat = String(value ?? '').replace(/[\r\n]+/g, ' ')
  return flat.length > 140 ? `${flat.slice(0, 140)}...` : flat
}

function nodeTypeValue(node: string) {
  const separator = node.indexOf(':')
  return separator === -1 ? 'node' : node.slice(0, separator).trim()
}

function flattenSubchanges(subchanges: any[], depth = 0, rows: FlatSubchange[] = []) {
  subchanges.forEach(subchange => {
    rows.push({
      id: subchange.id,
      label: String(subchange.label || 'change'),
      value: formatTreeValue(subchange.label, subchange.value),
      depth,
      order: rows.length
    })
    if (String(subchange.label).toUpperCase() === 'ADD_NODE') {
      rows.push({
        id: `${subchange.id}:node-type`,
        label: 'type',
        value: nodeTypeValue(String(subchange.value || 'node')),
        depth: depth + 1,
        order: rows.length
      })
    }
    flattenSubchanges(subchange.subchanges || [], depth + 1, rows)
  })
  return rows
}

function eventRows(event: MatrixChangeEvent) {
  const rows = flattenSubchanges(event.subchanges || [])
  if (event.title !== 'ADD_NODE') return rows
  return [
    {
      id: `${event.id}:node-type`,
      label: 'type',
      value: nodeTypeValue(event.node),
      depth: 0,
      order: -1
    },
    ...rows
  ]
}

function detailFromRow(row: FlatSubchange, kind: ReviewKind, value = row.value): ReviewDetail {
  return {
    key: `${row.id}:${kind}:${row.order}`,
    kind,
    marker: markers[kind],
    label: row.label,
    value,
    depth: row.depth
  }
}

function allEventDetails(event: MatrixChangeEvent, kind: ReviewKind) {
  return eventRows(event).map(row => detailFromRow(row, kind))
}

function mergedEventDetails(previous: MatrixChangeEvent, current: MatrixChangeEvent) {
  const previousRows = eventRows(previous)
  const currentRows = eventRows(current)
  const previousById = new Map(previousRows.map(row => [row.id, row]))
  const currentById = new Map(currentRows.map(row => [row.id, row]))
  const details: ReviewDetail[] = []

  currentRows.forEach(row => {
    const oldRow = previousById.get(row.id)
    if (!oldRow) {
      details.push(detailFromRow(row, 'added'))
      return
    }
    if (oldRow.label !== row.label || oldRow.value !== row.value) {
      details.push(detailFromRow(oldRow, 'removed'))
      details.push(detailFromRow(row, 'modified'))
      return
    }
    details.push(detailFromRow(row, 'unchanged'))
  })

  previousRows.forEach(row => {
    if (!currentById.has(row.id)) details.push(detailFromRow(row, 'removed'))
  })

  return details
}

function reviewChange(event: MatrixChangeEvent, kind: ReviewKind, key: string, details: ReviewDetail[], nodesById: Map<string, any>): ReviewChange {
  return {
    key,
    kind,
    marker: markers[kind],
    tone: eventTones[event.type as Exclude<MatrixChangeType, 'version'>] || 'current',
    title: event.title,
    ...splitNode(event.node),
    details,
    nodeObject: event.targetId ? nodesById.get(event.targetId) : undefined
  }
}

function buildVersionChanges(version: MatrixStrategyVersion, previousVersion?: MatrixStrategyVersion) {
  const currentEvents = treeEvents(version)
  const previousEvents = treeEvents(previousVersion)
  const currentById = new Map(currentEvents.map(event => [event.id, event]))
  const previousById = new Map(previousEvents.map(event => [event.id, event]))
  const changes: ReviewChange[] = []

  const currentNodesById = new Map<string, any>((version.snapshot.nodes || []).map(n => [n.id, n]))
  const previousNodesById = new Map<string, any>((previousVersion?.snapshot.nodes || []).map(n => [n.id, n]))
  const mergedNodesById = new Map<string, any>([...previousNodesById, ...currentNodesById])

  previousEvents.forEach(event => {
    const current = currentById.get(event.id)
    if (!current) {
      changes.push(reviewChange(
        event,
        'removed',
        `${version.id}:remove:${event.id}`,
        allEventDetails(event, 'removed'),
        mergedNodesById
      ))
      return
    }

    const changed = JSON.stringify(eventComparable(event)) !== JSON.stringify(eventComparable(current))
    changes.push(reviewChange(
      current,
      changed ? 'modified' : 'unchanged',
      `${version.id}:${changed ? 'modify' : 'keep'}:${current.id}`,
      changed
        ? mergedEventDetails(event, current)
        : allEventDetails(current, 'unchanged'),
      mergedNodesById
    ))
  })

  currentEvents.forEach(event => {
    if (previousById.has(event.id)) return
    const kind = eventKinds[event.type as Exclude<MatrixChangeType, 'version'>] || 'modified'
    changes.push(reviewChange(event, kind, `${version.id}:add:${event.id}`, allEventDetails(event, kind), mergedNodesById))
  })

  return changes
}

const reviewVersions = computed(() => {
  return props.versions.map((version, index) => {
    const changes = buildVersionChanges(version, props.versions[index - 1])
    return {
      ...version,
      changes,
      added: changes.filter(change => change.kind === 'added').length,
      removed: changes.filter(change => change.kind === 'removed').length,
      modified: changes.filter(change => change.kind === 'modified').length
    }
  }).reverse()
})

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp))
}
</script>

<style scoped>
.version-review-scroll {
  scrollbar-color: rgb(120 120 116 / 0.42) transparent;
  scrollbar-width: thin;
}

.version-diff {
  border-radius: 4px;
}

.version-review-panel :deep(.ex-panel-backdrop) {
  background-color: rgb(var(--theme-panel-rgb) / 0.55) !important;
  backdrop-filter: blur(8px) saturate(115%) !important;
  -webkit-backdrop-filter: blur(8px) saturate(115%) !important;
}

.version-review-theme.is-dark .version-review-panel :deep(.ex-panel-backdrop) {
  background-color: rgb(var(--theme-panel-rgb) / 0.48) !important;
}

.diff-marker-added {
  color: rgb(72 170 98);
}

.diff-marker-removed {
  color: rgb(246 76 98);
}

.diff-marker-modified {
  color: rgb(215 175 95);
}

.diff-version-title {
  color: rgb(126 24 36);
}

.diff-event-add {
  color: rgb(156 119 255);
}

.diff-event-delete,
.diff-event-connect {
  color: rgb(246 76 98);
}

.diff-event-current,
.diff-detail-key {
  color: rgb(215 175 95);
}

.diff-node-type,
.diff-node-name,
.diff-detail-value {
  color: rgb(34 34 32 / 0.94);
}

.diff-tree-glyph {
  color: rgb(34 34 32 / 0.52);
}

.diff-detail-removed {
  opacity: 0.62;
  text-decoration-line: line-through;
  text-decoration-color: rgb(246 76 98 / 0.9);
  text-decoration-thickness: 2px;
}

.diff-row-added {
  box-shadow: inset 3px 0 rgb(72 170 98 / 0.9);
}

.diff-row-modified {
  box-shadow: inset 3px 0 rgb(215 175 95 / 0.9);
}

.diff-row-removed {
  box-shadow: inset 3px 0 rgb(246 76 98 / 0.9);
  opacity: 0.62;
  text-decoration-line: line-through;
  text-decoration-color: rgb(246 76 98 / 0.9);
  text-decoration-thickness: 2px;
}

.version-expand-button {
  color: rgb(215 175 95);
}

.version-review-theme.is-dark .diff-version-title {
  color: rgb(170 42 55);
}

.version-review-theme.is-dark .diff-node-type,
.version-review-theme.is-dark .diff-node-name,
.version-review-theme.is-dark .diff-detail-value {
  color: rgb(249 246 240 / 0.94);
}

.version-review-theme.is-dark .diff-tree-glyph {
  color: rgb(249 246 240 / 0.56);
}

.version-review-fade-enter-active,
.version-review-fade-leave-active {
  transition: opacity 180ms ease;
}

.version-review-fade-enter-from,
.version-review-fade-leave-to {
  opacity: 0;
}
</style>
