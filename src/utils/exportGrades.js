import { utils, writeFile } from "xlsx";
import { format } from "date-fns";

export function exportGradesToExcel(studentsList = [], attemptsList = [], options = {}) {
    const filename = options.filename || `Quivio_Grade_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

    // 1. Prepare Sheet 1: Students Summary
    const summaryRows = studentsList.map((student, idx) => {
        const profile = student.profile || student;
        const attempts = student.attempts || [];
        const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
        const avgScore = attempts.length > 0 ? Math.round(totalScore / attempts.length) : (student.avg_score || 0);
        const passedCount = attempts.filter(a => a.passed).length;
        const passRate = attempts.length > 0 ? Math.round((passedCount / attempts.length) * 100) : 0;

        return {
            "S/N": idx + 1,
            "Student Name": profile.full_name || "N/A",
            "Student Code": student.student_code || "N/A",
            "Email": profile.email || "N/A",
            "Total Attempts": attempts.length || student.attempts_count || 0,
            "Average Score (%)": `${avgScore}%`,
            "Pass Rate (%)": `${passRate}%`,
            "Status": profile.is_active !== false ? "Active" : "Inactive"
        };
    });

    // 2. Prepare Sheet 2: Detailed Attempt Records
    const detailRows = (attemptsList.length > 0 ? attemptsList : extractAllAttempts(studentsList)).map((attempt, idx) => {
        const studentName = attempt.profile?.full_name || attempt.student_name || "N/A";
        const quizTitle = attempt.quiz?.title || attempt.quiz_title || "Quiz";
        const submittedDate = attempt.submitted_at || attempt.created_at;

        return {
            "Ref #": idx + 1,
            "Student Name": studentName,
            "Quiz Title": quizTitle,
            "Score (%)": `${attempt.score || 0}%`,
            "Status": attempt.passed ? "Passed" : "Failed",
            "Time Spent": attempt.time_spent_secs ? `${Math.round(attempt.time_spent_secs / 60)} min` : "N/A",
            "Submitted Date": submittedDate ? format(new Date(submittedDate), "yyyy-MM-dd HH:mm") : "N/A"
        };
    });

    // Create workbook & sheets
    const workbook = utils.book_new();

    const summarySheet = utils.json_to_sheet(summaryRows);
    utils.book_append_sheet(workbook, summarySheet, "Grades Summary");

    if (detailRows.length > 0) {
        const detailSheet = utils.json_to_sheet(detailRows);
        utils.book_append_sheet(workbook, detailSheet, "Attempt Details");
    }

    // Trigger Excel download
    writeFile(workbook, filename);
}

/**
 * Helper to flatten attempts from student list
 */
function extractAllAttempts(studentsList) {
    const list = [];
    studentsList.forEach(s => {
        if (s.attempts && Array.isArray(s.attempts)) {
            s.attempts.forEach(a => {
                list.push({
                    ...a,
                    profile: s.profile
                });
            });
        }
    });
    return list;
}

/**
 * Export Grade data to PDF format via styled print window / document generator
 */
export function exportGradesToPDF(studentsList = [], options = {}) {
    const title = options.title || "Quivio Class Grade Report";
    const reportDate = format(new Date(), "PPP p");

    // Calculate Summary Stats
    const totalStudents = studentsList.length;
    let totalScoreSum = 0;
    let totalAttemptsCount = 0;

    studentsList.forEach(s => {
        const avg = s.avg_score || 0;
        totalScoreSum += avg;
        if (s.attempts) totalAttemptsCount += s.attempts.length;
    });

    const classAverage = totalStudents > 0 ? Math.round(totalScoreSum / totalStudents) : 0;

    // Build printable HTML document for clean PDF export
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #0f172a;
                    padding: 30px;
                    margin: 0;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #6366f1;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .brand {
                    font-size: 24px;
                    font-weight: 800;
                    color: #6366f1;
                    letter-spacing: -0.5px;
                }
                .report-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 5px 0 0 0;
                }
                .report-date {
                    font-size: 12px;
                    color: #64748b;
                }
                .kpi-container {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .kpi-card {
                    flex: 1;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px 16px;
                }
                .kpi-label {
                    font-size: 11px;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .kpi-val {
                    font-size: 20px;
                    font-weight: 800;
                    color: #4f46e5;
                    margin-top: 4px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                th {
                    background-color: #f1f5f9;
                    color: #475569;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    text-align: left;
                    padding: 10px 12px;
                    border-bottom: 2px solid #cbd5e1;
                }
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 13px;
                    color: #334155;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                }
                .badge-active { background: #d1fae5; color: #047857; }
                .footer {
                    margin-top: 30px;
                    font-size: 11px;
                    color: #94a3b8;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 15px;
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div>
                    <div class="brand">QUIVIO</div>
                    <div class="report-title">${title}</div>
                </div>
                <div class="report-date">Generated: ${reportDate}</div>
            </div>

            <div class="kpi-container">
                <div class="kpi-card">
                    <div class="kpi-label">Total Students</div>
                    <div class="kpi-val">${totalStudents}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Class Average Score</div>
                    <div class="kpi-val">${classAverage}%</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Total Quiz Attempts</div>
                    <div class="kpi-val">${totalAttemptsCount}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Student Code</th>
                        <th>Email</th>
                        <th>Attempts</th>
                        <th>Avg Score</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsList.map((s, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td><strong>${s.profile?.full_name || "N/A"}</strong></td>
                            <td>${s.student_code || "N/A"}</td>
                            <td>${s.profile?.email || "N/A"}</td>
                            <td>${s.attempts_count || (s.attempts ? s.attempts.length : 0)}</td>
                            <td><strong>${s.avg_score || 0}%</strong></td>
                            <td><span class="badge badge-active">Active</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                Official Grade Report generated by Quivio Web Application &bull; Confidential
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}
