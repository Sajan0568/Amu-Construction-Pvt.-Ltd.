import React, {useEffect, useRef, useState} from 'react';
import {X, Send, PhoneCall, MessageSquareText, ArrowUpRight} from 'lucide-react';

const PHONE = '9806781536';
const EMAIL = 'amuconstruction1522@gmail.com';
const fallbackMessage = "I'm sorry, I don't have that information right now. Please contact our team directly and we'll be happy to help.";
const quickQuestions = ['About AMU Construction', 'Our Services', 'Our Projects', 'Contact Us', 'Request a Quote'];
const replies = {
  'About AMU Construction': 'AMU Construction and Suppliers Pvt. Ltd. is a Nepal-based construction and infrastructure company based in Kaski. We focus on dependable execution, practical engineering, quality workmanship, safety and clear coordination.',
  'Our Services': 'Our current capabilities include building construction, road and transport infrastructure, bridge structures, and civil infrastructure.',
  'Our Projects': 'Our website presents project focus across road infrastructure, bridge structures, building construction and civil infrastructure. Detailed project records are being prepared and will be added as the portfolio grows.',
  'Contact Us': `You can reach AMU Construction and Suppliers Pvt. Ltd. in Kaski, Nepal at ${PHONE} or ${EMAIL}.`,
};

function AmuChatIcon() {
  return <svg className="amu-chat-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path d="M5.5 7.5h21v13h-10l-5.5 5v-5h-5.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8.5 13.5h15l-1.9-4.25a2 2 0 0 0-1.83-1.2h-7.54a2 2 0 0 0-1.83 1.2zM6.7 13.5h18.6M16 8.05v5.45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

function fallbackAnswer(text) {
  const value = text.toLowerCase();
  if (value.includes('service')) return replies['Our Services'];
  if (value.includes('project')) return replies['Our Projects'];
  if (value.includes('where') || value.includes('located')) return 'AMU Construction and Suppliers Pvt. Ltd. is based in Kaski, Nepal.';
  if (value.includes('contact') || value.includes('phone') || value.includes('email')) return replies['Contact Us'];
  if (value.includes('quote') || value.includes('quotation') || value.includes('work with') || value.includes('construction work')) return 'To request a quote, share your name, phone number, required service or product, a short description, and optionally your project location. Our team will contact you soon.';
  if (value.includes('about') || value.includes('what do')) return replies['About AMU Construction'];
  return fallbackMessage;
}

async function askAI(history) {
  const response = await fetch('/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({messages: history.map(({from, text}) => ({role: from === 'bot' ? 'assistant' : 'user', content: text}))})});
  if (!response.ok) throw new Error('AI request failed');
  const data = await response.json();
  return data.reply || fallbackMessage;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{from: 'bot', text: 'Namaste! 👋 Welcome to AMU Construction and Suppliers Pvt. Ltd. How can we help you today?'}]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [quoteMode, setQuoteMode] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [leadError, setLeadError] = useState(false);
  const messagesEnd = useRef(null);
  useEffect(() => { messagesEnd.current?.scrollIntoView({behavior: 'smooth'}); }, [messages, quoteMode, quoteSent, isThinking]);
  const addMessage = (text, from = 'bot') => setMessages((current) => [...current, {from, text}]);
  const respond = async (userText, quickReply = false) => {
    const next = [...messages, {from: 'user', text: userText}];
    setMessages(next);
    if (quickReply && userText === 'Request a Quote') { setQuoteMode(true); addMessage('We would be happy to learn more. Please share your details below and our team will follow up.'); return; }
    setIsThinking(true);
    try { addMessage(await askAI(next)); } catch { addMessage(fallbackAnswer(userText)); } finally { setIsThinking(false); }
  };
  const ask = (question) => { if (!isThinking) respond(question, true); };
  const send = (event) => { event.preventDefault(); const value = input.trim(); if (!value || isThinking) return; setInput(''); respond(value); };
  const submitQuote = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setIsThinking(true); setLeadError(false);
    try { const response = await fetch('/api/leads', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(values)}); if (!response.ok) throw new Error('Lead submission failed'); setQuoteMode(false); setQuoteSent(true); addMessage("Thank you! We've received your project details. Our team will contact you soon."); }
    catch { setLeadError(true); addMessage('We could not submit the form right now. Please contact our team directly by phone or WhatsApp.'); }
    finally { setIsThinking(false); }
  };
  return <div className={`chatbot ${isOpen ? 'chatbot-open' : ''}`}>
    {isOpen && <section className="chat-window" aria-label="AMU Construction chat">
      <div className="chat-header"><div><strong>AMU Construction</strong><span>How can we help you?</span></div><button onClick={() => setIsOpen(false)} aria-label="Close chat"><X size={18}/></button></div>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`chat-message ${message.from}`}>{message.text}</div>)}
        {isThinking && <div className="chat-message bot chat-thinking" aria-label="AI is thinking"><span></span><span></span><span></span></div>}
        {!quoteMode && !quoteSent && !isThinking && <div className="quick-replies">{quickQuestions.map((question) => <button key={question} onClick={() => ask(question)}>{question}<ArrowUpRight size={13}/></button>)}</div>}
        {quoteMode && <form className="quote-form" onSubmit={submitQuote}><input name="name" required placeholder="Name" aria-label="Name"/><input name="phone" required type="tel" placeholder="Phone number" aria-label="Phone number"/><input name="requirement" required placeholder="Service or product needed" aria-label="Service or product needed"/><textarea name="description" required rows="3" placeholder="Short description of your requirement" aria-label="Short description of your requirement"/><input name="location" placeholder="Project location (optional)" aria-label="Project location (optional)"/><button className="chat-submit" type="submit" disabled={isThinking}>Send request <Send size={14}/></button></form>}
        {(quoteSent || leadError) && <div className="chat-actions"><a href={`tel:${PHONE}`}><PhoneCall size={14}/> Call Now</a><a href={`https://wa.me/977${PHONE}`} target="_blank" rel="noreferrer"><MessageSquareText size={14}/> WhatsApp</a></div>}
        <div ref={messagesEnd}/>
      </div>
      {!quoteMode && <form className="chat-input" onSubmit={send}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your question..." aria-label="Type your question" disabled={isThinking}/><button type="submit" aria-label="Send message" disabled={isThinking}><Send size={16}/></button></form>}
      <small className="chat-powered">Powered by AMU Construction</small>
    </section>}
    <button className="chat-launcher" onClick={() => setIsOpen((open) => !open)} aria-label={isOpen ? 'Close chat' : 'Open chat'} aria-expanded={isOpen}>{isOpen ? <X size={22}/> : <AmuChatIcon/>}</button>
  </div>;
}
