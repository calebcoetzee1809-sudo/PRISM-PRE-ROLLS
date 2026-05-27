/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarEvent, 
  ChatSpace, 
  GoogleContact, 
  listEvents, 
  listChatSpaces, 
  sendChatMessage, 
  listGoogleContacts 
} from '../workspace';
import { 
  googleSignIn, 
  logout, 
  getAccessToken 
} from '../firebase';
import { Client } from '../types';
import { 
  Cloud, 
  CloudLightning, 
  LogOut, 
  Calendar, 
  Video, 
  MessageSquare, 
  Users, 
  Send, 
  UserPlus, 
  Check, 
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

interface WorkspaceHubProps {
  user: any;
  accessToken: string | null;
  clients: Client[];
  onAddClient: (clientData: Omit<Client, 'id' | 'joinedDate' | 'orderHistory' | 'totalSpend'>) => void;
  onRefreshAuth: (user: any, token: string | null) => void;
}

export default function WorkspaceHub({
  user,
  accessToken,
  clients,
  onAddClient,
  onRefreshAuth
}: WorkspaceHubProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Dynamic Workspace states
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  
  // Chat message posting states
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [testText, setTestText] = useState<string>('Greetings from Preroll Ledger! Dispensary Cash Calculator successfully connected to Google Chat.');
  const [chatSuccessMsg, setChatSuccessMsg] = useState<string>('');
  
  // Track client import state locally to show registered checkmarks
  const [importedResourceNames, setImportedResourceNames] = useState<Record<string, boolean>>({});

  // Sync state and retrieve Google Workspace records
  const loadWorkspaceDetails = async (token: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Calendar Events
      try {
        const calEvents = await listEvents(token);
        setEvents(calEvents);
      } catch (err) {
        console.error('Failed to load Google Calendar events:', err);
      }

      // 2. Chat Spaces
      try {
        const spaces = await listChatSpaces(token);
        setChatSpaces(spaces);
        if (spaces.length > 0) {
          setSelectedSpace(spaces[0].name);
        }
      } catch (err) {
        console.error('Failed to load Google Chat Spaces:', err);
      }

      // 3. Google Contacts
      try {
        const googleCons = await listGoogleContacts(token);
        setContacts(googleCons);
      } catch (err) {
        console.error('Failed to load Google Contacts:', err);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unknown Workspace load error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadWorkspaceDetails(accessToken);
    }
  }, [accessToken]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await googleSignIn();
      if (res) {
        onRefreshAuth(res.user, res.accessToken);
        await loadWorkspaceDetails(res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Auth login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logout();
      onRefreshAuth(null, null);
      setEvents([]);
      setChatSpaces([]);
      setContacts([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestChat = async () => {
    if (!accessToken || !selectedSpace || !testText.trim()) return;
    try {
      setLoading(true);
      setChatSuccessMsg('');
      await sendChatMessage(accessToken, selectedSpace, testText.trim());
      setChatSuccessMsg('Checkout message successfully posted to selected Chat space!');
      
      setTimeout(() => {
        setChatSuccessMsg('');
      }, 5000);
    } catch (err: any) {
      setErrorMsg(`Chat send error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportContact = (contact: GoogleContact) => {
    // Check if client is already imported by looking up phone/email
    const alreadyExists = clients.some(c => 
      c.name.toLowerCase() === contact.name.toLowerCase() || 
      (contact.email && c.email.toLowerCase() === contact.email.toLowerCase()) ||
      (contact.phone && c.phone.replaceAll(/[-()\s]/g, '') === contact.phone.replaceAll(/[-()\s]/g, ''))
    );

    if (alreadyExists) {
      alert(`Contact "${contact.name}" is already registered in your dispensary Ledger Client Base.`);
      return;
    }

    // Call upper registration context
    onAddClient({
      name: contact.name,
      phone: contact.phone || '+1 (555) 000-0000',
      email: contact.email || '',
      favoriteStrain: '',
      notes: 'Imported from connected Google Contacts connection directory.'
    });

    setImportedResourceNames(prev => ({
      ...prev,
      [contact.resourceName]: true
    }));
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-stone-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-stone-100 flex items-center gap-2">
            <Cloud className="text-emerald-500 w-6 h-6 stroke-[2]" />
            Workspace Google Cloud Sync Integration HUB
          </h2>
          <p className="text-xs font-mono text-stone-400 mt-1">
            Authorize Google Meet video links, sync calendar events, write checkout notifications to Chat, and import active contacts.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center gap-2.5 text-xs font-mono text-rose-400">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!accessToken ? (
        /* Sign-in promo showcase card */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-xl"
        >
          <div className="mx-auto w-16 h-16 bg-emerald-950/40 border border-emerald-950 rounded-full flex items-center justify-center text-emerald-400">
            <CloudLightning className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-sans font-extrabold text-stone-100">Synchronize Dispensary CRM to Google Cloud Suite</h3>
            <p className="text-xs font-mono text-stone-400 max-w-md mx-auto leading-relaxed">
              Unlock live database synchronization back-ups in Google Cloud Firestore and seamlessly integrate Google Meet scheduling, Chat register alerts, and Google Contacts.
            </p>
          </div>

          <button
            id="workspace-btn-signin"
            onClick={handleSignIn}
            disabled={loading}
            className="inline-flex items-center justify-center gap-3 bg-stone-100 hover:bg-stone-200 text-stone-900 font-sans font-extrabold py-3 px-6 rounded-xl transition duration-150 cursor-pointer shadow-lg text-sm select-none"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Connect Google & Firebase Sync
          </button>
        </motion.div>
      ) : (
        /* Authenticated Control Dashboard Hub Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Identity Panel + Google Chat Notifications controller */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Identity card */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest block">
                Google Sync Identity
              </span>
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border border-stone-850" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg font-mono">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-sans font-extrabold text-stone-100">{user.displayName}</h4>
                  <span className="text-[10px] font-mono text-stone-400 block">{user.email}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-850 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-500">Cloud Sync Connected</span>
                <button
                  id="workspace-btn-signout"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Google Chat alerts setup card */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest block flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Google Chat Register Alerts
              </span>
              <p className="text-[11px] font-mono text-stone-400 leading-relaxed">
                Connect your retail rolling register to a designated Google Chat space to post live checkout receipt alerts.
              </p>

              {chatSpaces.length === 0 ? (
                <div className="p-3 bg-stone-950 border border-stone-850 rounded-lg text-center text-[10px] font-mono text-stone-500">
                  No active Google Chat spaces/conversations retrieved. Ensure your account is added to a Space.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-stone-400 uppercase font-semibold block">Select Chat Space</label>
                    <select
                      id="chat-spaces-select"
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-2.5 rounded-lg focus:outline-none"
                    >
                      {chatSpaces.map(sp => (
                        <option key={sp.name} value={sp.name}>{sp.displayName || sp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-stone-400 uppercase font-semibold block">Broadcast Test Alert Message</label>
                    <textarea
                      id="chat-test-content"
                      rows={3}
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono p-2 rounded-lg focus:outline-none resize-none"
                    />
                  </div>

                  {chatSuccessMsg && (
                    <div className="p-2 border border-emerald-900 bg-emerald-950/20 rounded-md text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{chatSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    id="btn-send-test-chat"
                    onClick={handleSendTestChat}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-bold py-2 rounded-lg transition text-xs cursor-pointer shadow"
                  >
                    <Send className="w-3.5 h-3.5 text-stone-900" />
                    Test Broadcast Space Notification
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Calendar upcoming + Google Contacts connection Directory list */}
          <div className="lg:col-span-7 space-y-6">

            {/* Google Calendar Consultation / Appointments overview */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Dispensary Appointments & consultations (Primary)
              </span>

              {events.length === 0 ? (
                <div className="p-8 text-center text-[11px] font-mono text-stone-500 bg-stone-950 border border-stone-850 rounded-xl">
                  No upcoming consultations or pickup appointments scheduled in key Google Calendar.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                  {events.map(ev => {
                    const eventDate = ev.start?.dateTime ? new Date(ev.start.dateTime) : null;
                    return (
                      <div key={ev.id} className="p-3 bg-stone-950 border border-stone-850 rounded-xl flex items-center justify-between gap-3 font-mono">
                        <div className="space-y-1 text-left">
                          <span className="text-xs font-sans font-extrabold text-stone-100 block">{ev.summary}</span>
                          <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-stone-450">
                            <span className="flex items-center gap-1 text-emerald-500">
                              <Clock className="w-3 h-3 text-emerald-500" />
                              {eventDate ? eventDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="text-[10px] text-stone-550 truncate max-w-[280px]">Note: {ev.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {ev.hangoutLink && (
                            <a
                              href={ev.hangoutLink}
                              target="_blank"
                              rel="noreferrer referrer"
                              className="flex items-center gap-1 bg-emerald-900/40 border border-emerald-900/60 hover:bg-emerald-900 text-emerald-400 text-[10px] py-1 px-2 rounded-lg transition hover:text-stone-100"
                            >
                              <Video className="w-3.5 h-3.5 currentColor" />
                              Meet
                            </a>
                          )}
                          {ev.htmlLink && (
                            <a
                              href={ev.htmlLink}
                              target="_blank"
                              rel="noreferrer referrer"
                              className="p-1 border border-stone-850 hover:border-stone-700 bg-stone-900 rounded-lg text-stone-400 hover:text-stone-200 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Google Contacts Connections directory imports */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Google Contacts connection CRM Importer
              </span>
              <p className="text-[11px] font-mono text-stone-400 leading-relaxed">
                Seamlessly import selected address book contacts as dispensary Clients.
              </p>

              {contacts.length === 0 ? (
                <div className="p-8 text-center text-[11px] font-mono text-stone-500 bg-stone-950 border border-stone-850 rounded-xl">
                  No search connection contacts retrieved. Populate your account contacts.
                </div>
              ) : (
                <div className="space-y-2 border border-stone-850 rounded-xl overflow-hidden shadow">
                  <div className="max-h-[250px] overflow-y-auto divide-y divide-stone-850 text-left">
                    {contacts.map((contact) => {
                      const imported = importedResourceNames[contact.resourceName];
                      return (
                        <div key={contact.resourceName} className="p-3 bg-stone-950 hover:bg-stone-900/50 flex justify-between items-center gap-3 font-mono">
                          <div>
                            <span className="text-xs font-sans font-extrabold text-stone-100 block">{contact.name}</span>
                            <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-stone-500 pt-0.5">
                              {contact.phone && <span>{contact.phone}</span>}
                              {contact.phone && contact.email && <span>&bull;</span>}
                              {contact.email && <span className="truncate max-w-[150px]">{contact.email}</span>}
                            </div>
                          </div>

                          <button
                            id={`btn-import-${contact.resourceName}`}
                            onClick={() => handleImportContact(contact)}
                            disabled={imported}
                            className={`flex items-center gap-1 justify-center py-1.5 px-3 rounded-lg text-[10px] font-bold transition duration-150 shadow border cursor-pointer select-none ${
                              imported 
                                ? 'bg-emerald-950/20 border-emerald-950/30 text-emerald-400/50' 
                                : 'bg-stone-900 hover:bg-emerald-600 border-stone-800 hover:border-emerald-750 text-stone-300 hover:text-stone-950'
                            }`}
                          >
                            {imported ? (
                              <>
                                <Check className="w-3 h-3" />
                                Imported
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3 shrink-0" />
                                Import
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
