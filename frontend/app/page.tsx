"use client";

import { useEffect, useState, FormEvent } from "react";
import { OperationsSummary, getOperationsSummary } from "../lib/api/operations";
import { optimizeTask, AITaskResponse } from "../lib/api/ai";
import { triggerNotification } from "../lib/api/notifications";
import { User, getUsers } from "../lib/api/users";
import { logTimesheet, getTimesheets, TimesheetResponse } from "../lib/api/timesheets";
import { createWebSocket } from "../lib/api/websocket";

export default function Dashboard() {
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);

  // Form states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AITaskResponse | null>(null);
  const [notifEmail, setNotifEmail] = useState("");
  const [notifSubject, setNotifSubject] = useState("");

  // Timesheet Form States
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [projectName, setProjectName] = useState("");
  const [hours, setHours] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [timesheets, setTimesheets] = useState<TimesheetResponse[]>([]);

  // Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const fetchSummary = async () => {
    try {
      const summaryData = await getOperationsSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to load summary", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const fetchTimesheetsList = async () => {
    try {
      const data = await getTimesheets();
      // Sort newest first
      setTimesheets(data.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()));
    } catch (err) {
      console.error("Failed to load timesheets", err);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchUsers();
    fetchTimesheetsList();

    // Setup WebSocket for Real-time events
    const ws = createWebSocket("");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Prepend new event to log, keep only the latest 10
      setLiveLogs(prev => [data, ...prev].slice(0, 10));

      if (data.type === 'NEW_TIMESHEET_LOGGED') {
        setTimesheets(prev => {
          const newTs: TimesheetResponse = {
            id: data.timesheet_id,
            user_full_name: data.user_full_name,
            project_name: data.project_name,
            hours_logged: data.hours_logged,
            task_description: data.task_description,
            logged_at: new Date().toISOString()
          };
          return [newTs, ...prev];
        });

        setSummary(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            team_efficiency: {
              ...prev.team_efficiency,
              total_hours_logged: prev.team_efficiency.total_hours_logged + data.hours_logged
            }
          };
        });
      } else if (data.type === 'NOTIFICATION_STATUS_UPDATE') {
        setSummary(prev => {
          if (!prev) return prev;
          const isSent = data.status === 'SENT';
          const isFailed = data.status === 'FAILED';
          return {
            ...prev,
            notification_stats: {
              ...prev.notification_stats,
              sent: isSent ? prev.notification_stats.sent + 1 : prev.notification_stats.sent,
              failed: isFailed ? prev.notification_stats.failed + 1 : prev.notification_stats.failed,
              pending: Math.max(0, prev.notification_stats.pending - 1)
            }
          };
        });
      }
    };

    return () => ws.close();
  }, []);

  const handleAiSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    try {
      const res = await optimizeTask({ prompt: aiPrompt });
      setAiResult(res);
      fetchSummary(); // Manually refresh summary for AI since it doesn't emit a WS event
    } catch (err: any) {
      console.error(err);
      alert(`AI optimization failed: ${err.message || 'Network Error'}`);
    }
  };

  const handleNotifSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!notifEmail || !notifSubject) return;
    try {
      await triggerNotification({ recipient_email: notifEmail, subject: notifSubject });
      setNotifEmail("");
      setNotifSubject("");
      setIsNotifModalOpen(false);
      // Optimistically update pending count
      setSummary(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          notification_stats: {
            ...prev.notification_stats,
            pending: prev.notification_stats.pending + 1
          }
        };
      });
    } catch (err) {
      alert("Notification dispatch failed");
    }
  };

  const handleTimesheetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !projectName || !hours) return;
    try {
      await logTimesheet({
        user_id: selectedUser,
        project_name: projectName,
        hours_logged: parseFloat(hours),
        task_description: taskDesc
      });
      setProjectName("");
      setHours("");
      setTaskDesc("");
      // No need to fetch data, WebSocket triggers refresh!
    } catch (err) {
      alert("Failed to log timesheet");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Operations Dashboard</h1>

        {/* Aggregate Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 border rounded-xl shadow-sm bg-white">
            <h2 className="font-semibold text-lg text-gray-600 mb-2">Team Efficiency</h2>
            <p className="text-4xl font-bold">{summary?.team_efficiency.total_hours_logged || 0} <span className="text-xl font-normal text-gray-400">hrs</span></p>
          </div>
          <div className="p-6 border rounded-xl shadow-sm bg-white">
            <h2 className="font-semibold text-lg text-gray-600 mb-2">AI Compute Saved</h2>
            <p className="text-4xl font-bold text-green-600">${summary?.ai_optimization.total_saved_compute.toFixed(2) || "0.00"}</p>
            <p className="text-sm text-gray-500 mt-2">{summary?.ai_optimization.total_cache_hits || 0} cache hits / {summary?.ai_optimization.total_fresh_calls || 0} fresh</p>
          </div>
          <div className="p-6 border rounded-xl shadow-sm bg-white">
            <h2 className="font-semibold text-lg text-gray-600 mb-2">Notification Health</h2>
            <p className="text-4xl font-bold text-blue-600">{summary?.notification_stats.sent || 0} <span className="text-xl font-normal text-gray-400">Sent</span></p>
            <p className="text-sm text-gray-500 mt-2">{summary?.notification_stats.pending || 0} Pending • {summary?.notification_stats.failed || 0} Failed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Actions Section */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAiPrompt('');
                  setAiResult(null);
                  setIsAiModalOpen(true);
                }}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                + Task
              </button>
              <button
                onClick={() => {
                  setNotifEmail('');
                  setNotifSubject('');
                  setIsNotifModalOpen(true);
                }}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                + Notification
              </button>
            </div>

            {/* Timesheet Panel */}
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="font-bold mb-4">Log Timesheet</h3>
              <form onSubmit={handleTimesheetSubmit} className="flex flex-col gap-3">
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                  required
                >
                  <option value="" disabled>Select User...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="Project Name"
                    className="border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                    required
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    placeholder="Hours"
                    className="border p-2 rounded w-24 focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                    required
                  />
                </div>
                <input
                  type="text"
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Task Description (Optional)"
                  className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition">Log Time</button>
              </form>

              {/* Timesheet History */}
              <div className="mt-8 border-t pt-6">
                <h4 className="font-semibold text-gray-700 mb-3">Recent Logs</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {timesheets.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No timesheets logged yet.</p>
                  ) : (
                    timesheets.slice(0, 20).map((ts) => (
                      <div key={ts.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-gray-800">{ts.user_full_name || "Unknown User"}</span>
                          <span className="text-blue-600 font-bold bg-blue-50 px-2 rounded">{ts.hours_logged}h</span>
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-700">{ts.project_name}</span>
                          {ts.task_description && <span className="text-gray-500"> - {ts.task_description}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Operations Feed */}
          <div className="p-6 border rounded-xl bg-white shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Live Operations Feed</h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded-full border border-green-200">Live Updates</span>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 mt-4 border rounded-lg bg-gray-50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b text-sm">
                    <th className="p-3 font-semibold w-1/4">Event Type</th>
                    <th className="p-3 font-semibold w-3/4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {liveLogs.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-400 italic">Waiting for incoming operations...</td>
                    </tr>
                  ) : (
                    liveLogs.map((log, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-white transition bg-white text-sm">
                        <td className="p-3 align-top">
                          {log.type === 'NEW_TIMESHEET_LOGGED' ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                              Timesheet
                            </span>
                          ) : log.type === 'NOTIFICATION_STATUS_UPDATE' ? (
                            <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                              Notification
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              System
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {log.type === 'NEW_TIMESHEET_LOGGED' ? (
                            <div>
                              <span className="font-semibold text-gray-900">{log.user_full_name}</span> logged <span className="font-semibold text-gray-900">{log.hours_logged} hrs</span> on <span className="font-semibold text-gray-900">{log.project_name}</span>
                            </div>
                          ) : log.type === 'NOTIFICATION_STATUS_UPDATE' ? (
                            <div>
                              Status: <span className={`font-semibold ${log.status === 'SENT' ? 'text-green-600' : 'text-yellow-600'}`}>{log.status}</span> (To: {log.recipient_email})
                            </div>
                          ) : (
                            <div className="text-gray-600">{log.type}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* AI Task Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="font-bold mb-4 text-xl">Test AI Caching Engine</h3>
            <form onSubmit={handleAiSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Enter a task to optimize..."
                className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition">Optimize</button>
            </form>
            {aiResult && (
              <div className={`mt-4 p-4 rounded text-sm ${aiResult.cached ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <p><strong>Status:</strong> {aiResult.cached ? "⚡ Cache Hit (Fast & Free)" : "🐢 Cache Miss (Fresh Execution)"}</p>
                <p><strong>Cost Saved:</strong> ${aiResult.saved_compute_cost}</p>
                <p className="mt-2 text-gray-600 italic">"{aiResult.response.summary}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsNotifModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="font-bold mb-4 text-xl">Queue Notification</h3>
            <form onSubmit={handleNotifSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={notifEmail}
                onChange={e => setNotifEmail(e.target.value)}
                placeholder="target@example.com"
                className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
                required
              />
              <input
                type="text"
                value={notifSubject}
                onChange={e => setNotifSubject(e.target.value)}
                placeholder="Notification Subject"
                className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
                required
              />
              <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded font-medium hover:bg-gray-900 transition">Dispatch</button>
            </form>
            <p className="text-xs text-gray-500 mt-3">Will trigger the background task and broadcast via WebSocket when complete.</p>
          </div>
        </div>
      )}
    </div>
  );
}
