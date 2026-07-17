const SPREADSHEET_ID = '1a44qnu9XQ0f9NbustSp8sYBOzvUiAsf-vgBhDSOUlWc';
const ADVISOR_EMAIL = 'debugdatta@gmail.com';
const CC_EMAIL = '';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action !== 'submitQuiz') return;

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const nodeId = String(data.nodeId).padStart(2, '0');
    const tabName = 'Node_' + nodeId;

    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      const headers = ['Timestamp', 'Date', 'Time', 'Name', 'Email'];
      for (let i = 1; i <= data.total; i++) {
        headers.push('Q' + i + '_Ans', 'Q' + i + '_Correct');
      }
      headers.push('Score', 'Total');
      sheet.appendRow(headers);
    }

    const row = [
      data.timestamp,
      new Date(data.timestamp).toISOString().split('T')[0],
      new Date(data.timestamp).toTimeString().split(' ')[0].slice(0, 5),
      data.name,
      data.email
    ];
    for (let i = 1; i <= data.total; i++) {
      const r = data.responses.find(x => x.question === i);
      row.push(r ? r.selected : '', r ? r.correct : false);
    }
    row.push(data.score, data.total);
    sheet.appendRow(row);

    let tracker = ss.getSheetByName('Tracker');
    if (!tracker) {
      tracker = ss.insertSheet('Tracker');
      const theaders = ['Name', 'Email'];
      for (let i = 1; i <= 41; i++) {
        theaders.push('Node_' + String(i).padStart(2, '0'));
      }
      theaders.push('Quizzes Taken', 'Avg Score');
      tracker.appendRow(theaders);
    }

    const emailCol = 2;
    const existingData = tracker.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][emailCol - 1]).toLowerCase() === data.email.toLowerCase()) {
        foundRow = i + 1;
        break;
      }
    }

    const nodeCol = 2 + data.nodeId;
    if (foundRow > 0) {
      tracker.getRange(foundRow, nodeCol).setValue(data.score + '/' + data.total);
    } else {
      const newRow = [data.name, data.email];
      for (let i = 1; i <= 41; i++) {
        newRow.push(i === data.nodeId ? data.score + '/' + data.total : '-');
      }
      newRow.push(1, data.score / data.total);
      tracker.appendRow(newRow);
    }

    if (data.email && data.email !== 'guest@anonymous') {
      let body = 'Quiz: Node ' + nodeId + '\n';
      body += 'Name: ' + data.name + '\n';
      body += 'Email: ' + data.email + '\n';
      body += 'Date: ' + new Date(data.timestamp).toISOString().split('T')[0] + '\n';
      body += 'Score: ' + data.score + ' / ' + data.total + ' (' + Math.round((data.score / data.total) * 100) + '%)\n\n';
      body += 'Responses:\n';
      for (const r of data.responses) {
        body += 'Q' + r.question + ': Answered ' + r.selected + ' -> ' + (r.correct ? 'Correct' : 'Wrong') + '\n';
      }

      const subject = 'QuantTrain Quiz: Node ' + nodeId + ' - ' + data.name + ' scored ' + data.score + '/' + data.total;
      const recipients = ADVISOR_EMAIL;
      const cc = CC_EMAIL || undefined;
      MailApp.sendEmail({ to: recipients, cc: cc, subject: subject, body: body });
    }
  } catch (err) {
    console.error('Error: ' + err.message);
  }
}
