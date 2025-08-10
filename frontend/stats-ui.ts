/**
 * Statistics and UI Updates Module
 * Handles graph statistics calculation, UI updates, and state management
 */

import { highlightNode } from './interaction-handlers.ts';
import { showMainInterface } from './file-processor.ts';

// Custom interface for elements with updateCount method
interface HTMLElementWithUpdateCount extends HTMLElement {
  updateCount?: (count: any) => void;
}

/**
 * Update graph statistics display
 */
function updateGraphStatistics(data, filteredNodes = null) {
  const stats = data.metadata.stats;
  let appCount = 0;
  let libCount = 0;
  let totalEdges = 0;
  let nodesToCount = [];

  // New spec format
  nodesToCount = filteredNodes || data.nodes.map(node => node.id);

  // Count apps vs libs from nodes
  data.nodes.forEach(node => {
    if (!filteredNodes || filteredNodes.includes(node.id)) {
      if (node.type === 'app') {
        appCount++;
      } else if (node.type === 'lib') {
        libCount++;
      }
    }
  });

  // Count edges
  totalEdges = data.edges.filter(edge => {
    return !filteredNodes || (filteredNodes.includes(edge.from) && filteredNodes.includes(edge.to));
  }).length;

  // Update statistics display
  const totalItems = data.nodes.length;
  document.getElementById('total-files').textContent = totalItems.toString();
  document.getElementById('total-apps').textContent = appCount.toString();
  document.getElementById('total-libs').textContent = libCount.toString();
  document.getElementById('total-edges').textContent = totalEdges.toString();
  document.getElementById('visible-nodes').textContent = nodesToCount.length.toString();

  // Update top files
  updateTopModules(data, nodesToCount);
}

/**
 * Update top modules display for new spec format
 */
function updateTopModules(data, visibleModules) {
  // Create module summary for statistics
  const modules = data.nodes
    .filter(node => !visibleModules || visibleModules.includes(node.id))
    .map(node => ({
      id: node.id,
      name: node.id.split('/').pop(),
      linesOfCode: node.linesOfCode,
      fileCount: node.fileCount,
      incomingCount: node.incomingCount,
      outgoingCount: node.outgoingCount,
      type: node.type,
    }));

  // Most imported modules (highest incoming count)
  const mostImported = modules.sort((a, b) => b.incomingCount - a.incomingCount).slice(0, 5);

  // Largest modules (most lines of code)
  const largest = modules.sort((a, b) => b.linesOfCode - a.linesOfCode).slice(0, 5);

  // Update most imported table
  const importedTable = document.getElementById('most-imported');
  if (importedTable) {
    const tbody = importedTable.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = mostImported
        .map(
          module =>
            `<tr onclick="highlightNode('${module.id}')">
                <td title="${module.id}">${module.name}</td>
                <td>${module.incomingCount}</td>
                <td>${module.linesOfCode}</td>
            </tr>`
        )
        .join('');
    }
  }

  // Update largest files table
  const largestTable = document.getElementById('largest-files');
  if (largestTable) {
    const tbody = largestTable.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = largest
        .map(
          module =>
            `<tr onclick="highlightNode('${module.id}')">
                <td title="${module.id}">${module.name}</td>
                <td>${module.linesOfCode}</td>
                <td>${module.fileCount}</td>
            </tr>`
        )
        .join('');
    }
  }

  // Update most exports (outgoing dependencies)
  const mostExporting = modules.sort((a, b) => b.outgoingCount - a.outgoingCount).slice(0, 5);

  const exportsTable = document.getElementById('most-exports');
  if (exportsTable) {
    const tbody = exportsTable.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = mostExporting
        .map(
          module =>
            `<tr onclick="highlightNode('${module.id}')">
                <td title="${module.id}">${module.name}</td>
                <td>${module.outgoingCount}</td>
                <td>${module.type}</td>
            </tr>`
        )
        .join('');
    }
  }
}

/**
 * UI state management functions
 */
function showLoading(message = 'Processing file...') {
  hideAllMessages();
  document.getElementById('loading-text').textContent = message;
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('progress-text').textContent = '0%';
  document.getElementById('loading-message').style.display = 'flex';
}

function updateProgress(percentage, message = null) {
  if (message) {
    document.getElementById('loading-text').textContent = message;
  }
  document.getElementById('progress-fill').style.width = percentage + '%';
  document.getElementById('progress-text').textContent = Math.round(percentage) + '%';
}

function showError(message) {
  hideAllMessages();
  document.getElementById('error-text').textContent = message;
  document.getElementById('error-message').style.display = 'flex';
  console.error('Validation error:', message);
}

function showSuccess(message) {
  hideAllMessages();
  document.getElementById('success-text').textContent = message;
  document.getElementById('success-message').style.display = 'flex';
}

function hideAllMessages() {
  document.getElementById('loading-message').style.display = 'none';
  document.getElementById('error-message').style.display = 'none';
  document.getElementById('success-message').style.display = 'none';
}

function showUploadInterface() {
  document.getElementById('upload-section').style.display = 'block';
  document.getElementById('main-layout').style.display = 'none';
  hideAllMessages();
  // Reset file input
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
}

/**
 * Show performance indicator
 */
function showPerformanceIndicator(message) {
  // Remove any existing indicator
  const existing = document.querySelector('.performance-indicator');
  if (existing) existing.remove();

  // Create new indicator
  const indicator = document.createElement('div');
  indicator.className = 'performance-indicator';
  indicator.innerHTML = `
        <span class="perf-icon">⚡</span>
        <span class="perf-text">${message}</span>
    `;

  // Add styles if not already present
  if (!document.querySelector('style[data-perf-indicator]')) {
    const style = document.createElement('style');
    style.setAttribute('data-perf-indicator', 'true');
    style.textContent = `
            .performance-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 12px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .perf-icon {
                font-size: 14px;
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(indicator);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 5000);
}

/**
 * Show temporary message
 */
function showTemporaryMessage(message, isError = false) {
  // Remove any existing message
  const existing = document.querySelector('.temp-message');
  if (existing) existing.remove();

  const messageEl = document.createElement('div');
  messageEl.className = `temp-message ${isError ? 'error' : 'success'}`;
  messageEl.textContent = message;

  // Add styles if not already present
  if (!document.querySelector('style[data-temp-message]')) {
    const style = document.createElement('style');
    style.setAttribute('data-temp-message', 'true');
    style.textContent = `
            .temp-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 12px 24px;
                border-radius: 6px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                z-index: 10000;
                min-width: 200px;
                text-align: center;
            }
            .temp-message.success {
                background: #2ecc71;
                color: white;
            }
            .temp-message.error {
                background: #e74c3c;
                color: white;
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(messageEl);

  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.remove();
    }
  }, 3000);
}

/**
 * Update multi-select indicator
 */
function updateMultiSelectIndicator(isActive, selectedCount = 0) {
  // Remove any existing indicator
  const existing = document.querySelector('.multi-select-indicator');
  if (existing) existing.remove();

  if (isActive) {
    const indicator = document.createElement('div');
    indicator.className = 'multi-select-indicator';
    indicator.innerHTML = `
            <span class="multi-icon">⌘</span>
            <span class="multi-text">Multi-select mode: Click nodes to select multiple</span>
            <span class="multi-count">${selectedCount} selected</span>
        `;

    // Add styles if not already present
    if (!document.querySelector('style[data-multi-select]')) {
      const style = document.createElement('style');
      style.setAttribute('data-multi-select', 'true');
      style.textContent = `
                .multi-select-indicator {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    background: rgba(138, 43, 226, 0.9);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 6px;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 13px;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 2px solid rgba(138, 43, 226, 0.6);
                }
                .multi-icon {
                    font-size: 16px;
                    font-weight: bold;
                }
                .multi-count {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(indicator);

    // Update count when selection changes
    const updateCount = count => {
      const countSpan = indicator.querySelector('.multi-count');
      if (countSpan) {
        countSpan.textContent = `${count} selected`;
      }
    };

    // Store update function for later use
    (indicator as HTMLElementWithUpdateCount).updateCount = updateCount;
  }
}

export {
  updateGraphStatistics,
  updateTopModules,
  showLoading,
  updateProgress,
  showError,
  showSuccess,
  hideAllMessages,
  showUploadInterface,
  showMainInterface,
  showPerformanceIndicator,
  showTemporaryMessage,
  updateMultiSelectIndicator,
};
