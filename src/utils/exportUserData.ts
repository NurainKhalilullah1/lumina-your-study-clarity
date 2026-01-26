import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UserData {
  profile: any;
  courses: any[];
  assignments: any[];
  documents: any[];
  flashcards: any[];
  quizSessions: any[];
  studyEvents: any[];
  weeklyGoals: any[];
}

export const fetchAllUserData = async (userId: string): Promise<UserData> => {
  const [profile, courses, assignments, documents, flashcards, quizSessions, studyEvents, weeklyGoals] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('courses').select('*').eq('user_id', userId),
    supabase.from('assignments').select('*').eq('user_id', userId),
    supabase.from('user_files').select('*').eq('user_id', userId),
    supabase.from('flashcards').select('*').eq('user_id', userId),
    supabase.from('quiz_sessions').select('*, quiz_questions(*)').eq('user_id', userId),
    supabase.from('study_events').select('*').eq('user_id', userId),
    supabase.from('weekly_goals').select('*').eq('user_id', userId),
  ]);

  return {
    profile: profile.data,
    courses: courses.data || [],
    assignments: assignments.data || [],
    documents: documents.data || [],
    flashcards: flashcards.data || [],
    quizSessions: quizSessions.data || [],
    studyEvents: studyEvents.data || [],
    weeklyGoals: weeklyGoals.data || [],
  };
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
};

const generatePDFHTML = (data: UserData, userName: string): string => {
  const exportDate = format(new Date(), 'MMMM d, yyyy');
  
  // Group flashcards by deck
  const flashcardsByDeck: Record<string, any[]> = {};
  data.flashcards.forEach(card => {
    const deck = card.deck_name || 'General';
    if (!flashcardsByDeck[deck]) flashcardsByDeck[deck] = [];
    flashcardsByDeck[deck].push(card);
  });

  // Calculate study stats
  const pomodorosCompleted = data.studyEvents.filter(e => e.event_type === 'pomodoro_completed').length;
  const documentsAnalyzed = data.studyEvents.filter(e => e.event_type === 'document_analyzed').length;
  const flashcardsReviewed = data.studyEvents.filter(e => e.event_type === 'flashcard_reviewed').length;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StudyFlow Data Export - ${userName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
      color: #1f2937;
      line-height: 1.6;
      max-width: 850px;
      margin: 0 auto;
      padding: 40px;
      background: #ffffff;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #7C3AED;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #7C3AED;
      margin-bottom: 8px;
    }
    
    .logo span {
      color: #1f2937;
    }
    
    .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    
    .user-info {
      margin-top: 16px;
      font-size: 16px;
      color: #374151;
    }
    
    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    
    .section-title {
      color: #7C3AED;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-icon {
      font-size: 20px;
    }
    
    .section-count {
      background: #f3f4f6;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: auto;
    }
    
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .profile-item {
      background: #f9fafb;
      padding: 12px 16px;
      border-radius: 8px;
    }
    
    .profile-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .profile-value {
      font-size: 15px;
      font-weight: 500;
      color: #1f2937;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    
    tr:hover {
      background: #fafafa;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-overdue {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .priority-high {
      color: #dc2626;
      font-weight: 600;
    }
    
    .priority-medium {
      color: #f59e0b;
    }
    
    .priority-low {
      color: #10b981;
    }
    
    .flashcard-deck {
      margin-bottom: 20px;
    }
    
    .deck-title {
      font-size: 15px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 10px;
      padding-left: 4px;
    }
    
    .flashcard {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    
    .flashcard-front {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .flashcard-back {
      color: #6b7280;
      font-size: 14px;
      padding-left: 12px;
      border-left: 3px solid #7C3AED;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #7C3AED 0%, #6366f1 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 13px;
      opacity: 0.9;
    }
    
    .empty-state {
      text-align: center;
      padding: 24px;
      color: #9ca3af;
      font-style: italic;
    }
    
    .course-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .course-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .course-code {
      font-weight: 600;
      color: #7C3AED;
      min-width: 80px;
    }
    
    .course-title {
      color: #374151;
    }
    
    .quiz-score {
      font-weight: 700;
      font-size: 16px;
    }
    
    .score-good {
      color: #059669;
    }
    
    .score-ok {
      color: #f59e0b;
    }
    
    .score-bad {
      color: #dc2626;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 20px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .stat-card {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📚 Study<span>Flow</span></div>
    <div class="subtitle">Your Complete Data Export</div>
    <div class="user-info">
      <strong>${userName}</strong> • Exported on ${exportDate}
    </div>
  </div>

  <!-- Profile Section -->
  <div class="section">
    <div class="section-title">
      <span class="section-icon">👤</span>
      Profile Information
    </div>
    ${data.profile ? `
    <div class="profile-grid">
      <div class="profile-item">
        <div class="profile-label">Email</div>
        <div class="profile-value">${data.profile.email || 'Not set'}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Full Name</div>
        <div class="profile-value">${data.profile.full_name || 'Not set'}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Member Since</div>
        <div class="profile-value">${formatDate(data.profile.created_at)}</div>
      </div>
      <div class="profile-item">
        <div class="profile-label">Storage Used</div>
        <div class="profile-value">${formatBytes(data.profile.storage_used_bytes)} / ${formatBytes(data.profile.storage_limit_bytes)}</div>
      </div>
    </div>
    ` : '<div class="empty-state">Profile information not available</div>'}
  </div>

  <!-- Courses Section -->
  <div class="section">
    <div class="section-title">
      <span class="section-icon">📖</span>
      Courses
      <span class="section-count">${data.courses.length}</span>
    </div>
    ${data.courses.length > 0 ? `
    <div>
      ${data.courses.map(course => `
        <div class="course-item">
          <div class="course-color" style="background: ${course.color?.replace('bg-', '#') || '#7C3AED'}"></div>
          <span class="course-code">${course.code}</span>
          <span class="course-title">${course.title}</span>
        </div>
      `).join('')}
    </div>
    ` : '<div class="empty-state">No courses added yet</div>'}
  </div>

  <!-- Assignments Section -->
  <div class="section">
    <div class="section-title">
      <span class="section-icon">📝</span>
      Assignments
      <span class="section-count">${data.assignments.length}</span>
    </div>
    ${data.assignments.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Course</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.assignments.map(a => `
          <tr>
            <td>${a.title}</td>
            <td>${a.course_name || '-'}</td>
            <td>${formatDate(a.due_date)}</td>
            <td class="priority-${a.priority}">${a.priority || 'Medium'}</td>
            <td><span class="status-badge status-${a.status}">${a.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<div class="empty-state">No assignments added yet</div>'}
  </div>

  <!-- Documents Section -->
  <div class="section">
    <div class="section-title">
      <span class="section-icon">📄</span>
      Documents
      <span class="section-count">${data.documents.length}</span>
    </div>
    ${data.documents.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>File Name</th>
          <th>Size</th>
          <th>Uploaded</th>
        </tr>
      </thead>
      <tbody>
        ${data.documents.map(d => `
          <tr>
            <td>${d.file_name}</td>
            <td>${formatBytes(d.file_size || 0)}</td>
            <td>${formatDate(d.created_at)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<div class="empty-state">No documents uploaded yet</div>'}
  </div>

  <!-- Flashcards Section -->
  <div class="section">
    <div class="section-title">
      <span class="section-icon">🎴</span>
      Flashcards
      <span class="section-count">${data.flashcards.length}</span>
    </div>
    ${data.flashcards.length > 0 ? `
    ${Object.entries(flashcardsByDeck).map(([deckName, cards]) => `
      <div class="flashcard-deck">
        <div class="deck-title">📁 ${deckName} (${cards.length} cards)</div>
        ${cards.map(card => `
          <div class="flashcard">
            <div class="flashcard-front">Q: ${card.front}</div>
            <div class="flashcard-back">A: ${card.back}</div>
          </div>
        `).join('')}
      </div>
    `).join('')}
    ` : '<div class="empty-state">No flashcards created yet</div>'}
  </div>

  <!-- Quiz History Section -->
  <div class="section">
    <div class="section-title">
      <span class="section-icon">📊</span>
      Quiz History
      <span class="section-count">${data.quizSessions.length}</span>
    </div>
    ${data.quizSessions.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Document</th>
          <th>Questions</th>
          <th>Score</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${data.quizSessions.map(q => {
          const scorePercent = q.total_questions ? Math.round((q.score / q.total_questions) * 100) : 0;
          const scoreClass = scorePercent >= 70 ? 'score-good' : scorePercent >= 50 ? 'score-ok' : 'score-bad';
          return `
            <tr>
              <td>${q.document_name || 'Untitled Quiz'}</td>
              <td>${q.total_questions || q.num_questions || '-'}</td>
              <td class="quiz-score ${scoreClass}">${q.score !== null ? `${q.score}/${q.total_questions} (${scorePercent}%)` : 'Not completed'}</td>
              <td>${formatDateTime(q.created_at)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    ` : '<div class="empty-state">No quizzes taken yet</div>'}
  </div>

  <!-- Study Statistics Section -->
  <div class="section">
    <div class="section-title">
      <span class="section-icon">📈</span>
      Study Statistics
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${pomodorosCompleted}</div>
        <div class="stat-label">Pomodoros Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${documentsAnalyzed}</div>
        <div class="stat-label">Documents Analyzed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${flashcardsReviewed}</div>
        <div class="stat-label">Flashcards Reviewed</div>
      </div>
    </div>
  </div>

  <!-- Weekly Goals Section -->
  ${data.weeklyGoals.length > 0 ? `
  <div class="section">
    <div class="section-title">
      <span class="section-icon">🎯</span>
      Weekly Goals
      <span class="section-count">${data.weeklyGoals.length}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Week Starting</th>
          <th>Quiz Target</th>
          <th>Flashcard Target</th>
          <th>Study Minutes Target</th>
        </tr>
      </thead>
      <tbody>
        ${data.weeklyGoals.map(g => `
          <tr>
            <td>${formatDate(g.week_start)}</td>
            <td>${g.quiz_target}</td>
            <td>${g.flashcard_target}</td>
            <td>${g.study_minutes_target} min</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by StudyFlow • ${exportDate}</p>
    <p>This document contains all your personal data stored in StudyFlow.</p>
  </div>
</body>
</html>
  `;
};

export const exportUserDataAsPDF = async (userId: string, userName: string): Promise<void> => {
  const data = await fetchAllUserData(userId);
  const htmlContent = generatePDFHTML(data, userName);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups for this site.');
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};
