interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment_name?: string;
}

export const exportAsText = (messages: Message[], title: string = 'StudyFlow Chat') => {
  const date = new Date().toLocaleDateString();
  let content = `${title}\nExported on ${date}\n${'='.repeat(50)}\n\n`;

  messages.forEach((msg) => {
    const sender = msg.role === 'user' ? 'You' : 'StudyFlow';
    content += `${sender}:\n${msg.content}\n\n`;
    if (msg.attachment_name) {
      content += `[Attachment: ${msg.attachment_name}]\n\n`;
    }
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportAsPDF = (messages: Message[], title: string = 'StudyFlow Chat') => {
  const date = new Date().toLocaleDateString();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { 
          font-family: 'Segoe UI', system-ui, sans-serif; 
          padding: 40px; 
          max-width: 800px; 
          margin: 0 auto; 
          line-height: 1.6;
        }
        h1 { 
          color: #7C3AED; 
          border-bottom: 2px solid #7C3AED; 
          padding-bottom: 10px; 
        }
        .date { 
          color: #666; 
          margin-bottom: 30px; 
        }
        .message { 
          margin-bottom: 20px; 
          padding: 15px; 
          border-radius: 12px; 
        }
        .user { 
          background: linear-gradient(135deg, #7C3AED, #9333EA); 
          color: white; 
          margin-left: 40px; 
        }
        .assistant { 
          background: #f3f4f6; 
          border: 1px solid #e5e7eb; 
          margin-right: 40px; 
        }
        .sender { 
          font-weight: 600; 
          margin-bottom: 8px; 
        }
        .content { 
          white-space: pre-wrap; 
        }
        .attachment { 
          font-size: 12px; 
          opacity: 0.8; 
          margin-top: 8px; 
        }
        @media print {
          body { padding: 20px; }
          .message { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="date">Exported on ${date}</p>
      ${messages.map(msg => `
        <div class="message ${msg.role}">
          <div class="sender">${msg.role === 'user' ? 'You' : 'StudyFlow'}</div>
          <div class="content">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          ${msg.attachment_name ? `<div class="attachment">📎 ${msg.attachment_name}</div>` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
