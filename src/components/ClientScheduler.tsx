/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client } from '../types';
import { createEvent } from '../workspace';
import { 
  Calendar, 
  Video, 
  Plus, 
  Clock, 
  Check, 
  HelpCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface ClientSchedulerProps {
  client: Client;
  accessToken: string | null;
  onUpdateClient: (id: string, updated: Partial<Client>) => void;
}

export default function ClientScheduler({
  client,
  accessToken,
  onUpdateClient
}: ClientSchedulerProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Scheduler Form states
  const [summary, setSummary] = useState(`Consultation: ${client.name}`);
  const [description, setDescription] = useState(client.notes || 'Dispensary joint configuration and rolling feedback session.');
  const [dateTime, setDateTime] = useState('');
  const [includeMeet, setIncludeMeet] = useState(true);

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setErrorMsg('Google Workspace connection lost. Reconnect in the Google Sync Hub tab.');
      return;
    }
    if (!dateTime) {
      setErrorMsg('Please select a valid appointment date and time.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Set end time to 30 minutes after start as default
      const startIso = new Date(dateTime).toISOString();
      const endIso = new Date(new Date(dateTime).getTime() + 30 * 60 * 1000).toISOString();

      const createdVal = await createEvent(accessToken, {
        summary,
        description,
        start: { dateTime: startIso },
        end: { dateTime: endIso }
      }, includeMeet);

      // Append to local client's appointments database list
      const existingAppointments = client.appointments || [];
      const newAppointment = {
        id: createdVal.id || `app-${Date.now()}`,
        summary: createdVal.summary,
        description: createdVal.description || '',
        dateTime: startIso,
        meetLink: createdVal.hangoutLink || undefined
      };

      const updatedAppointments = [...existingAppointments, newAppointment].sort(
        (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );

      // Save via callback
      onUpdateClient(client.id, {
        appointments: updatedAppointments
      });

      setSuccessMsg(`Appointment scheduled on Google Calendar! ${includeMeet ? 'Google Meet video workspace created.' : ''}`);
      setDateTime('');
      setSummary(`Consultation: ${client.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create calendar appointment');
    } finally {
      setLoading(false);
    }
  };

  const clientApps = client.appointments || [];

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-5 text-left">
      <div className="border-b border-stone-800 pb-2.5 flex justify-between items-center">
        <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          Google Calendar & Meet Scheduler
        </span>
        <span className="text-[9px] font-mono text-stone-500 uppercase">Interactive Workspace</span>
      </div>

      {!accessToken ? (
        <div className="p-4 bg-stone-950 border border-stone-850 rounded-xl space-y-2 text-center">
          <HelpCircle className="w-6 h-6 text-stone-600 mx-auto" />
          <p className="text-[11px] font-mono text-stone-400 max-w-xs mx-auto">
            Connect Google Workspace in the **Workspace Sync** tab to schedule consultations, appointments, and generate Google Meet video streams for {client.name}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          
          {/* Scheduling New Consultation Form (Col: 1) */}
          <form onSubmit={handleScheduleAppointment} className="space-y-3 p-3.5 bg-stone-950 border border-stone-855 rounded-xl">
            <span className="text-[9px] font-mono text-stone-400 uppercase block font-bold">New Booking</span>
            
            {successMsg && (
              <div className="p-2 border border-emerald-900 bg-emerald-950/20 rounded-md text-[10px] font-mono text-emerald-400">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-2 border border-rose-950 bg-rose-950/20 rounded-md text-[10px] font-mono text-rose-450">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[8px] font-mono text-stone-400 uppercase font-black block">Appointment Topic</label>
              <input
                id="appt-summary"
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 text-stone-250 text-xs font-mono px-2 py-1.5 rounded-md focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-mono text-stone-400 uppercase font-black block">Consultation Day & Time</label>
              <input
                id="appt-datetime"
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 text-stone-250 text-xs font-mono px-2 py-1.5 rounded-md focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-mono text-stone-400 uppercase font-black block">Meeting Brief / Agenda</label>
              <textarea
                id="appt-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 text-stone-250 text-xs font-mono p-2 rounded-md focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                id="appt-meet"
                type="checkbox"
                checked={includeMeet}
                onChange={(e) => setIncludeMeet(e.target.checked)}
                className="rounded text-emerald-600 bg-stone-900 border-stone-800 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="appt-meet" className="text-[10px] font-mono text-stone-300 font-bold flex items-center gap-1 cursor-pointer">
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                Generate Google Meet room video link
              </label>
            </div>

            <button
              id="appt-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-bold py-2 rounded-lg text-xs transition shadow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Workspace Event...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-stone-950 stroke-[3]" />
                  Schedule Calendar Consultation
                </>
              )}
            </button>
          </form>

          {/* List of Scheduled Events for customer (Col: 2) */}
          <div className="space-y-2.5">
            <span className="text-[9px] font-mono text-stone-400 uppercase block font-bold">Scheduled Pickups</span>
            {clientApps.length === 0 ? (
              <div className="p-8 text-center text-[10px] font-mono text-stone-500 bg-stone-950 border border-stone-855 rounded-xl">
                No active appointments scheduled for {client.name}.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {clientApps.map((app) => {
                  const dateVal = new Date(app.dateTime);
                  return (
                    <div key={app.id} className="p-3 bg-stone-950 border border-stone-850 rounded-xl flex items-center justify-between gap-3 font-mono">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[11px] font-sans font-extrabold text-stone-100 block truncate max-w-[150px]">{app.summary}</span>
                        <div className="flex items-center gap-1 text-[9px] text-emerald-500">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>{dateVal.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {app.meetLink && (
                        <a
                          href={app.meetLink}
                          target="_blank"
                          rel="noreferrer referrer"
                          className="flex items-center gap-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900 text-emerald-400 text-[9px] font-bold py-1 px-2.0 rounded transition h-7"
                        >
                          <Video className="w-3 h-3 text-emerald-400" />
                          Join Meet
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
