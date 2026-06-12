import { useState, type FormEvent } from 'react';
import { Send, Users } from 'lucide-react';
import type { ChatMessage, StudyGroup, StudyMatch, User } from '../types';
import HeaderNavigation from './HeaderNavigation';

interface GroupChatScreenProps {
  currentUser: User | null;
  acceptedMatch: StudyMatch | null;
  group: StudyGroup | null;
  messages: ChatMessage[];
  onBack: () => void;
  onNavigateHome: () => void;
  onConfirmGroup: () => Promise<void> | void;
  onSendMessage: (message: string) => Promise<void>;
}

const timeLabel = (timestamp: string) => new Intl.DateTimeFormat('en', {
  hour: 'numeric',
  minute: '2-digit'
}).format(new Date(timestamp));

export default function GroupChatScreen({
  currentUser,
  acceptedMatch,
  group,
  messages,
  onBack,
  onNavigateHome,
  onConfirmGroup,
  onSendMessage
}: GroupChatScreenProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const members = group?.members || [currentUser?.name, acceptedMatch?.candidateName].filter(Boolean) as string[];

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      await onSendMessage(message);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-background pb-12 text-brand-on-background">
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
        <HeaderNavigation onBack={onBack} onNavigateHome={onNavigateHome} context={acceptedMatch && !group ? <button onClick={() => void onConfirmGroup()} className="inline-flex rounded-lg bg-brand-primary px-2.5 py-2 text-xs font-bold text-white hover:bg-brand-primary-container cursor-pointer lg:px-3">
          <span className="lg:hidden">Accept</span>
          <span className="hidden lg:inline">Accept Goal & View Session</span>
        </button> : undefined} />
      </header>

      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{group ? 'Group Conversation' : 'New Match Conversation'}</p>
              <h1 className="mt-1 text-xl font-extrabold text-brand-on-surface">
                {group?.groupName || acceptedMatch?.course || 'Study Group'} Chat
              </h1>
              <p className="mt-1 text-xs text-brand-on-surface-variant">
                Meet the group, review the shared goal, and get ready for the upcoming session.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-brand-surface-container px-3 py-1.5 text-xs font-bold text-brand-primary">
              <Users className="h-3.5 w-3.5" />
              {members.length}
            </div>
          </div>

          <div className="mt-4 flex -space-x-2">
            {members.map((member) => (
              <span key={member} title={member} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-surface-container text-[9px] font-black text-brand-primary">
                {member.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-4 flex min-h-[360px] flex-1 flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="mx-auto mt-16 max-w-xs text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface-container text-brand-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-sm font-extrabold text-brand-on-surface">Start the conversation</h2>
                <p className="mt-1 text-xs leading-relaxed text-brand-on-surface-variant">
                  Introduce yourself, align on the study goal, or ask when everyone is available.
                </p>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.userId === currentUser?.id;
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${isMine ? 'rounded-br-md bg-brand-primary text-white' : 'rounded-bl-md bg-brand-surface-low text-brand-on-surface'}`}>
                    {!isMine && <p className="mb-1 text-[10px] font-black text-brand-primary">{message.senderName}</p>}
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    <p className={`mt-1 text-[9px] ${isMine ? 'text-white/70' : 'text-brand-outline'}`}>{timeLabel(message.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-4">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message your new study group..."
              className="min-w-0 flex-1 rounded-xl border border-brand-outline-variant bg-brand-surface-lowest px-4 py-3 text-sm text-brand-on-surface focus:border-brand-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              title="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white hover:bg-brand-primary-container disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
