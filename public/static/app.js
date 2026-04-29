document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput')
  const uploadBtn = document.getElementById('uploadBtn')
  const loading = document.getElementById('loading')
  const result = document.getElementById('result')
  const details = document.getElementById('details')

  let currentData = null

  uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0]

    if (!file) {
      alert('파일을 선택해주세요.')
      return
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
      return
    }

    const rate9 = parseFloat(document.getElementById('rate9').value)
    const rate14 = parseFloat(document.getElementById('rate14').value)

    if (isNaN(rate9) || rate9 < 0 || rate9 > 100) {
      alert('수수료율 9% 정산율을 올바르게 입력해주세요. (0~100)')
      return
    }
    if (isNaN(rate14) || rate14 < 0 || rate14 > 100) {
      alert('수수료율 14% 정산율을 올바르게 입력해주세요. (0~100)')
      return
    }

    // UI 초기화
    result.innerHTML = ''
    details.innerHTML = ''
    loading.style.display = 'block'
    uploadBtn.disabled = true

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('rate9', rate9.toString())
      formData.append('rate14', rate14.toString())

      const response = await fetch('/api/calculate', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '서버 오류가 발생했습니다.')
      }

      currentData = data
      displayResults(data)
      
    } catch (error) {
      displayError(error.message)
    } finally {
      loading.style.display = 'none'
      uploadBtn.disabled = false
    }
  })

  function displayResults(data) {
    const summaryHTML = `
      <div class="summary-header">
        <h2>정산 계산 결과</h2>
        <div class="total-info">
          <div class="total-item">
            <div class="label">전체 광고비 합계</div>
            <div class="value">${formatNumber(data.total.전체광고비)}원</div>
          </div>
          <div class="total-item">
            <div class="label">전체 정산 금액</div>
            <div class="value">${formatNumber(data.total.전체정산금액)}원</div>
          </div>
        </div>
      </div>
      <table class="summary-table">
        <thead>
          <tr>
            <th>순위</th>
            <th>고객사 계정명</th>
            <th>광고비 합계</th>
            <th>정산 금액</th>
          </tr>
        </thead>
        <tbody>
          ${data.summary.map((item, index) => `
            <tr onclick="showDetails('${escapeHtml(item.계정명)}')">
              <td>
                <span class="rank ${getRankClass(index + 1)}">${index + 1}</span>
              </td>
              <td><strong>${escapeHtml(item.계정명)}</strong></td>
              <td>${formatNumber(item.합계금액)}원</td>
              <td class="amount">${formatNumber(item.정산금액)}원</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    result.innerHTML = summaryHTML

    if (data.summary.length > 0) {
      showDetails(data.summary[0].계정명)
    }
  }

  function showDetails(accountName) {
    if (!currentData) return

    const account = currentData.summary.find(item => item.계정명 === accountName)
    if (!account) return

    const rows = document.querySelectorAll('.summary-table tbody tr')
    rows.forEach(row => row.classList.remove('active'))
    const activeRow = Array.from(rows).find(row => 
      row.querySelector('td:nth-child(2)').textContent.trim() === accountName
    )
    if (activeRow) activeRow.classList.add('active')

    const detailHTML = `
      <div class="detail-card">
        <div class="detail-header">
          <h3>${escapeHtml(accountName)}</h3>
          <div class="detail-total">${formatNumber(account.정산금액)}원</div>
        </div>
        <table class="detail-table">
          <thead>
            <tr>
              <th>매체사</th>
              <th>광고비</th>
              <th>정산율</th>
              <th>정산 금액</th>
            </tr>
          </thead>
          <tbody>
            ${account.내역.map(detail => {
              const ratePercent = Math.round(detail.정산율 * 1000) / 10
              return `
                <tr>
                  <td>${escapeHtml(detail.매체사)}</td>
                  <td>${formatNumber(detail.합계금액)}원</td>
                  <td><span class="rate-badge" style="${getRateBadgeStyle(ratePercent)}">${ratePercent}%</span></td>
                  <td class="amount">${formatNumber(detail.정산금액)}원</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    `
    details.innerHTML = detailHTML
  }

  function displayError(message) {
    result.innerHTML = `
      <div class="error">
        <h3>오류 발생</h3>
        <p>${escapeHtml(message)}</p>
        <p>파일 형식과 내용을 확인해주세요.</p>
      </div>
    `
  }

  function formatNumber(num) {
    if (typeof num !== 'number') return '0'
    return Math.floor(num).toLocaleString('ko-KR')
  }

  function getRankClass(rank) {
    if (rank === 1) return 'rank-1'
    if (rank === 2) return 'rank-2'
    if (rank === 3) return 'rank-3'
    return 'rank-other'
  }

  function getRateBadgeStyle(rate) {
    if (rate <= 5) return 'background:#fff3e0;color:#e65100;'
    if (rate <= 10) return 'background:#e8f5e9;color:#2e7d32;'
    return 'background:#e3f2fd;color:#1565c0;'
  }

  function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  fileInput.addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name
    if (fileName) {
      console.log('선택된 파일:', fileName)
    }
  })
})
