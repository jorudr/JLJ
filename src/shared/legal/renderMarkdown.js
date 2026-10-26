// Minimal renderer for the legal documents: headings, paragraphs, lists,
// tables, bold, links and <autolinks>. Input is escaped before formatting.

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const renderInline = (text) => escapeHtml(text)
  .replace(/&lt;([^\s@&]+@[^\s&]+)&gt;/g, '<a href="mailto:$1">$1</a>')
  .replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const splitRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())

const renderTable = (lines) => {
  const [head, , ...rows] = lines
  const headHtml = splitRow(head).map(cell => `<th>${renderInline(cell)}</th>`).join('')
  const bodyHtml = rows
    .map(row => `<tr>${splitRow(row).map(cell => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
    .join('')
  return `<div class="legal-table"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`
}

export function renderMarkdown(source) {
  const blocks = source.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/)

  return blocks.map((block) => {
    const lines = block.split('\n')
    const heading = block.match(/^(#{1,4})\s+(.+)$/)

    if (heading && lines.length === 1) {
      const level = Math.max(heading[1].length, 2)
      const number = heading[2].match(/^(\d+)\./)
      const id = number ? ` id="section-${number[1]}"` : ''
      return `<h${level}${id}>${renderInline(heading[2])}</h${level}>`
    }

    if (lines.every(line => line.trim().startsWith('|'))) {
      return renderTable(lines)
    }

    if (lines.every(line => /^\s*-\s+/.test(line))) {
      return `<ul>${lines.map(line => `<li>${renderInline(line.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`
    }

    return `<p>${renderInline(lines.join(' '))}</p>`
  }).join('\n')
}
