(function () {
const C = (t, c) => ({ t, c }), A = (t, s) => ({ t, s, av: true }), G = on => ({ tg: on }), M = t => ({ t, mu: true }), S = (t, s) => ({ t, s }), B = (t, s) => ({ t, s, b: true }), L = t => ({ t, lock: true }), H = (...a) => ({ ch: a }), K = t => ({ t, lnk: true }), MO = t => ({ t, mono: true });
const f = (l, c, v, x) => [l, c, v, x || {}];
const X = window.BST = window.BST || { pages: {}, dialogs: {}, scen: {} };
const P = X.pages, D = X.dialogs, SC = X.scen;
const hist = n => ['History', 's:Opening the audit log filtered to ' + n];

// Company profile
P.company = { nav: 'company', t: 'Company profile', tag: 'v1', d: 'The facts that print on buyer-facing material and invoices. One account is one developer company.', menu: [hist('Company profile')], b: [
  { k: 'fields', title: 'Brand', desc: 'What buyers see on packs, the availability page and email footers.', cap: 'settings.company.update', rows: [
    f('Company logo', 'upload', 'Lalex', { s: 'Buyer packs, availability page, email footers' }),
    f('Trading name', 'text', 'Lalex Developments', { s: 'Shown to buyers' })] },
  { k: 'fields', title: 'Legal and billing', desc: 'Feeds invoices, contracts and Plan and billing.', rows: [
    f('Legal entity name', 'text', 'Lalex Developments Ltd', { s: 'Shown on invoices and contracts' }),
    f('Registration number', 'text', 'C 84213'),
    f('VAT number', 'text', 'MT 2419 8830', { chip: ['Format valid', 'ok'], h: 'Format check only' }),
    f('Registered address', 'area', 'Triq il-Kbira 112, Mosta MST 1017, Malta'),
    f('Main contact', 'select', 'Mark Galea · Owner', { h: 'Defaults to the account owner' })] },
  { k: 'fields', title: 'Regional', rows: [
    f('Default market', 'select', 'Malta', { h: 'Pre-fills market rules in Data and privacy' }),
    f('Currency', 'select', 'EUR · Euro', { h: 'Display only in v1. No multi-currency pricing.' }),
    f('Area unit', 'radio', ['m²', 'sq ft'], { s: 'Units, comparisons and packs' }),
    f('Time zone', 'select', 'Europe/Malta (CEST, UTC+2)', { h: 'Hold expiry and response clocks use this time zone' }),
    f('Date format', 'select', '30 Sep 2026'),
    f('Buyer-facing languages', 'chips', ['English', 'Maltese', ['+ Add', 'out']], { h: 'Studio and Perform price one language. Each extra language is quoted.', hw: true })] },
  { k: 'note', tone: 'out', text: 'To close the account, contact Bricly support. There is no delete here.' }] };

// Personal
P.me = { nav: 'me', t: 'My profile', tag: 'v1', d: 'Only affects you.', cr: 'My profile', b: [
  { k: 'fields', cap: 'me.profile.update', rows: [
    f('Photo', 'upload', 'SU'),
    f('Name', 'text', 'Sam'),
    f('Job title', 'text', 'Sales Rep, Verdala'),
    f('Email', 'static', 'sam@lalex.mt', { h: 'Changed by an admin' }),
    f('Mobile number', 'text', '+356 7912 4410', { chip: ['Registered for WhatsApp commands', 'ok'], h: 'Manage in WhatsApp' }),
    f('Interface language', 'select', 'English'),
    f('Theme', 'radio', ['Light', 'Dark', 'System'], { sel: 2 })] }] };

P.mysecurity = { nav: 'mysecurity', t: 'Security', tag: 'v1', cr: 'Security', d: 'How you sign in and where you are signed in.', acts: [['Sign out everywhere', 'd:signout']], b: [
  { k: 'fields', title: 'Sign-in', cap: 'me.security.update', rows: [
    f('Password', 'static', 'Last changed 12 Aug 2026', { h: 'Change password' }),
    f('Two-step verification', 'toggle', true, { v: 'On · authenticator app', s: 'Required for your role' }),
    f('Backup codes', 'static', '8 of 10 left', { h: 'Show codes' })] },
  { k: 'table', title: 'Active sessions', cols: ['Device', 'Location', 'Last active', ''], gc: '2fr 1fr 1fr 110px', ra: [3], rows: [
    [S('Chrome on macOS', 'This device'), 'Mosta, MT', 'Now', M('')],
    [S('Bricly on iPhone 15'), 'Mosta, MT', '2 hours ago', K('Sign out')],
    [S('Safari on iPad'), 'Valletta, MT', '4 days ago', K('Sign out')]] }] };

P.calendar = { nav: 'calendar', t: 'Connected calendar', tag: 'v1', cr: 'Connected calendar', d: 'Appointments you book in Bricly appear in your calendar, and busy times in your calendar block booking slots.', b: [
  { k: 'cards', title: 'Calendars', items: [
    { t: 'Google Calendar', s: 'sam@lalex.mt', logo: 'G', chip: ['Connected', 'ok'], meta: 'Synced 4 min ago', act: 'Disconnect' },
    { t: 'Outlook', s: 'Two-way sync', logo: 'O', chip: ['Coming later', 'neu'], meta: 'v1.2', dim: true },
    { t: 'iCloud', s: 'Two-way sync', logo: 'iC', chip: ['Coming later', 'neu'], meta: 'v1.2', dim: true }] },
  { k: 'fields', title: 'Google Calendar', cap: 'me.calendar.update', rows: [
    f('Bricly writes to', 'select', 'Work · sam@lalex.mt'),
    f('Last sync', 'static', 'Today, 11:16'),
    f('Show busy times from', 'chips', ['Work', 'Personal'])] }] };

const WA_EX = { k: 'note', tone: 'out', nt: 'What you can say', items: ['Get · “What’s left in Verdala block B?”', 'Send · “Send Maria the Verdala pack”', 'Prepare · “Prepare an offer for Luca on B-12”', 'Update · “Move Luca to viewing booked”', 'Create · “New lead Joe Vella 7922 1100, walk-in”', 'Request · “Hold B-12 for Luca until Friday”', 'Log · “Called Maria, she wants a 3-bed”'], act: ['Every command is saved in Chats', 's:Opening Chats'] };
P.mywa = { nav: 'mywa', t: 'WhatsApp', tag: 'v1', cr: 'WhatsApp', d: 'Keep Bricly current by messaging it. Your manager or an admin registers your number.', b: [
  { k: 'fields', rows: [
    f('Your number', 'static', '+356 7912 4410', { chip: ['Registered', 'ok'] }),
    f('Message Bricly on', 'static', '+356 2778 0100', { b: true, h: 'Lalex · Bricly' }),
    f('Last command', 'static', '“Move Luca to viewing booked” · 12 min ago')] }, WA_EX] };
P['mywa-un'] = { ...P.mywa, b: [
  { k: 'fields', rows: [
    f('Your number', 'static', '+356 7912 4410', { chip: ['Not registered', 'warn'] }),
    f('Message Bricly on', 'static', '+356 2778 0100', { b: true }),
    f('Registration', 'button', 'Request registration', { h: 'Sends a request to Rachel Mifsud. Messages from an unregistered number get a polite refusal.' })] }, WA_EX] };

const ch3 = (a, w, e, lk) => H(['In-app', a, lk], ['WhatsApp', w, lk], ['Email', e]);
P.mynotif = { nav: 'mynotif', t: 'My notifications', tag: 'v1', cr: 'My notifications', d: 'The events that reach you and how. Locked channels are set by your admin.', b: [
  { k: 'table', cap: 'me.notifications.update', cols: ['Event', 'Channels'], gc: '1.4fr 1fr', rows: [
    [S('New lead assigned', 'To you'), ch3(1, 1, 0)], [S('First contact overdue'), ch3(1, 1, 0)], [S('Approval decided', 'Your requests'), ch3(1, 1, 0, 1)],
    [S('Unit sold on another deal', 'Affects your deals'), ch3(1, 1, 1, 1)], [S('Appointment reminder'), ch3(1, 1, 0)], [S('Required document missing at stage'), ch3(1, 0, 1)]] },
  { k: 'fields', title: 'Quiet hours', tag: 'Proposed', desc: 'WhatsApp and email wait until quiet hours end. In-app still collects.', rows: [
    f('Quiet hours', 'toggle', true), f('From', 'select', '20:00'), f('Until', 'select', '07:30')] }] };

// Team
const TEAM_ROWS = [
  { c: [A('Mark Galea', 'mark@lalex.mt'), 'Owner', 'All', M('—'), C('Registered', 'ok'), 'Today', C('Active', 'ok')] },
  { c: [A('Claire Azzopardi', 'claire@lalex.mt'), 'Admin', 'All', M('—'), C('Registered', 'ok'), 'Today', C('Active', 'ok')] },
  { c: [A('Rachel Mifsud', 'rachel@lalex.mt'), 'Sales Manager', 'All', M('—'), C('Registered', 'ok'), 'Today', C('Active', 'ok')] },
  { c: [A('Paul Grech', 'paul@lalex.mt'), 'Sales Manager', 'Marina Heights, Onyx Rise', 'Rachel Mifsud', C('Registered', 'ok'), 'Yesterday', C('Active', 'ok')] },
  { c: [A('Sam', 'sam@lalex.mt'), 'Sales Rep', 'Verdala, Marina Heights', 'Rachel Mifsud', C('Registered', 'ok'), '12 min ago', C('Active', 'ok')], go: 'p:user' },
  { c: [A('Karl Zammit', 'karl@lalex.mt'), 'Sales Rep', 'Verdala', 'Rachel Mifsud', C('Registered', 'ok'), '1 hour ago', C('Active', 'ok')], go: 'p:user-karl' },
  { c: [A('Sarah Azzopardi', 'sarah@lalex.mt'), 'Sales Rep', 'Onyx Rise', 'Paul Grech', C('Not registered', 'warn'), '3 days ago', C('Active', 'ok')] },
  { c: [A('Matthew Vella', 'matthew@lalex.mt'), 'Sales Rep', 'Marina Heights', 'Rachel Mifsud', C('Registered', 'ok'), 'Today', C('Active', 'ok')] }];
const teamTbl = rows => ({ k: 'table', cap: 'team.read', search: 'Search people', filters: ['Role', 'Development', 'Status'], cols: ['Name', 'Role', 'Developments', 'Reports to', 'WhatsApp', 'Last active', 'Status'], gc: '1.8fr 1fr 1.4fr 1.1fr 1fr 0.9fr 1fr', rows });
const TEAM_TABS = [['Members', 'team'], ['Roles and permissions', 'team/roles']];
P.team = { nav: 'team', t: 'Team', tag: 'v1', d: 'Unlimited users on your plan.', tabs: TEAM_TABS, acts: [['Invite users', 'd:invite']], menu: [['Export list'], hist('Team')], b: [teamTbl(TEAM_ROWS)] };
P['team-invited'] = { ...P.team, b: [teamTbl([{ c: [A('luke.borg@lalex.mt', 'Invited today · Resend · Revoke'), 'Sales Rep', 'Verdala, Onyx Rise', 'Rachel Mifsud', C('Pre-registered', 'ok'), M('Expires in 7 days'), C('Invited', 'info')], hl: true }, { c: [A('anna.vella@lalex.mt', 'Invited today · Resend · Revoke'), 'Sales Rep', 'Verdala, Onyx Rise', 'Rachel Mifsud', C('Not registered', 'warn'), M('Expires in 7 days'), C('Invited', 'info')], hl: true }, ...TEAM_ROWS])] };
P['team-deact'] = { ...P.team, b: [teamTbl([...TEAM_ROWS.filter(r => r.c[0].t !== 'Karl Zammit'), { c: [A('Karl Zammit', 'karl@lalex.mt'), 'Sales Rep', M('—'), M('—'), M('Stopped'), 'Today, 11:24', C('Deactivated', 'neu')], dim: true }])] };

const FULL = C('Full', 'pri'), OWN = C('Own only', 'info'), VIEW = C('View', 'neu'), NONE = M('—');
P['team/roles'] = { nav: 'team', t: 'Team', tag: 'v1', d: 'Unlimited users on your plan.', cr: 'Team / Roles and permissions', tabs: TEAM_TABS, menu: [hist('Roles')], b: [
  { k: 'table', title: 'Permission matrix', desc: 'Roles are fixed in v1. Flexibility comes from per-rep approval rules and per-development team membership. The Owner is an Admin with billing authority.', cap: 'team.roles.read', cols: ['Capability', 'Owner', 'Admin', 'Sales Manager', 'Sales Rep'], gc: '2.2fr 1fr 1fr 1fr 1fr', rows: [
    ['See opportunities and deals', FULL, FULL, FULL, OWN], ['Approve holds, reservations, price exceptions', FULL, FULL, FULL, NONE], ['Change unit prices', FULL, FULL, FULL, NONE],
    ['Import units and deals', FULL, FULL, FULL, NONE], ['Invite, change role, deactivate users', FULL, FULL, NONE, NONE], ['Edit approval rules', FULL, FULL, C('Own team', 'info'), NONE],
    [S('Edit sales setup', 'Stages, labels, holds, checklists'), FULL, FULL, VIEW, NONE],
    ['Connect integrations', FULL, FULL, NONE, NONE], ['View plan and invoices', FULL, FULL, NONE, NONE], ['View credits and usage', FULL, FULL, VIEW, C('Own usage', 'info')],
    ['Buy or request credit top-ups', FULL, FULL, NONE, NONE], ['Change data and privacy rules', FULL, FULL, NONE, NONE], ['View audit log', FULL, FULL, NONE, NONE],
    ['Export data', FULL, FULL, C('View-scope export', 'info'), NONE]] },
  { k: 'note', tone: 'warn', nt: 'Sales Manager column is a proposal', text: 'The PRD fixes only that managers see team and approvals and admins see settings. Confirm before build.' },
  { k: 'table', title: 'Roles', cols: ['Role', 'Who', 'Release', 'Can reach Settings'], gc: '1fr 1.6fr 1fr 2fr', rows: [
    [B('Owner'), 'The developer who signed. One per account, transferable', C('v1', 'pri'), 'Everything, including Plan and billing'],
    [B('Admin'), 'Runs the workspace', C('v1', 'pri'), 'Everything except transferring ownership'],
    [B('Sales Manager'), 'Runs the sales team, approves', C('v1', 'pri'), 'Approvals, Sales setup (view), Credits (view), Team (view)'],
    [B('Sales Rep'), 'Sells, mostly on WhatsApp', C('v1', 'pri'), 'Personal only'],
    { c: [B('Ops'), 'Contracts, documents, payments, inventory', C('Phase 2', 'info'), 'Personal, Documents and checklists'], dim: true },
    { c: [B('Marketing Lead'), 'Brand, website, ads, collateral', C('v1.1', 'info'), 'Personal, Lead capture, Brand'], dim: true },
    { c: [B('Agency user'), 'External agency, own deals only', C('Phase 2', 'info'), 'Personal only'], dim: true }] }] };

// User detail
const USER_TABS = [['Profile', 'user'], ['Access', 'user/access'], ['Approvals', 'user/approvals'], ['WhatsApp', 'user/wa'], ['Usage', 'user/usage']];
const uBase = { nav: 'team', t: 'Sam', tag: 'v1', d: 'Sales Rep · Verdala, Marina Heights · reports to Rachel Mifsud', back: ['Team', 'team'], cr: 'Team / Sam', tabs: USER_TABS, menu: [['Change role', 'd:changerole'], ['Reset password', 's:Password reset link sent to sam@lalex.mt'], ['Deactivate', 'd:deact-sam', 'danger'], hist('Sam')] };
P.user = { ...uBase, b: [{ k: 'fields', cap: 'team.users.update', rows: [f('Name', 'text', 'Sam'), f('Email', 'text', 'sam@lalex.mt', { h: 'Only admins change this' }), f('Job title', 'text', 'Sales Rep, Verdala'), f('Mobile number', 'text', '+356 7912 4410'), f('Joined', 'static', '14 Aug 2026 · invited by Claire Azzopardi')] }] };
P['user/access'] = { ...uBase, b: [{ k: 'fields', cap: 'team.users.access', rows: [
  f('Role', 'select', 'Sales Rep', { h: 'Role changes apply on their next request' }),
  f('Developments', 'chips', [['Verdala', 'pri'], ['Marina Heights', 'pri'], ['+ Add', 'out']], { h: 'Receives leads from these by rotation' }),
  f('Reports to', 'select', 'Rachel Mifsud', { h: 'Their requests go to this manager’s queue' })] }] };
P['user/approvals'] = { ...uBase, b: [{ k: 'table', title: 'Sam’s approval rules', desc: 'Set in Approvals. Shown here for reference.', link: ['Edit in Approvals', 'p:approvals'], cols: ['Action', 'Setting', 'Source'], gc: '1.4fr 1fr 1fr', rows: [
  ['Hold', C('Needs approval', 'warn'), M('Team default')], ['Reservation', C('Needs approval', 'warn'), M('Team default')], ['Price exception', C('Needs approval', 'warn'), M('Team default')], ['Unit status change', C('Needs approval', 'warn'), M('Team default')], ['Contract association', C('Needs approval', 'warn'), M('Team default')]] }] };
P['user/wa'] = { ...uBase, b: [{ k: 'fields', rows: [f('Number', 'static', '+356 7912 4410'), f('Registration', 'static', 'Registered by Rachel Mifsud on 14 Aug 2026', { chip: ['Registered', 'ok'] }), f('Last command', 'static', '“Move Luca to viewing booked” · 12 min ago', { h: 'Open thread in Chats' })] }] };
P['user/usage'] = { ...uBase, b: [
  { k: 'stats', items: [{ l: 'Credits this month', v: '1,340', s: 'Since 14 Sep · 27% of the account’s used credits' }, { l: 'WhatsApp commands', v: '312' }, { l: 'Briefs', v: '16' }] },
  { k: 'bars', title: 'By action', items: [['WhatsApp command or confirmation', 624], ['Reading an inbound buyer message', 240], ['Drafting a follow-up, reply or offer', 186], ['Daily brief', 96], ['Meeting transcription', 150], ['Buyer pack', 44]] }] };
P['user-karl'] = { ...uBase, t: 'Karl Zammit', d: 'Sales Rep · Verdala · reports to Rachel Mifsud', cr: 'Team / Karl Zammit', menu: [['Change role'], ['Reset password'], ['Deactivate', 'd:deact', 'danger'], hist('Karl Zammit')], b: [{ k: 'fields', rows: [f('Name', 'text', 'Karl Zammit'), f('Email', 'text', 'karl@lalex.mt'), f('Job title', 'text', 'Senior Sales Rep'), f('Mobile number', 'text', '+356 7988 3021'), f('Joined', 'static', '2023 · imported at onboarding')] }] };

D.invite = { t: 'Invite users', w: 580, d: 'Users are unlimited on your plan.', ok: 'Send 2 invites', done: '2 invites sent. They expire in 7 days.', b: [{ k: 'fields', rows: [
  f('Emails', 'chips', [['luke.borg@lalex.mt', 'pri'], ['anna.vella@lalex.mt', 'pri'], ['Type or paste more', 'out']]),
  f('Role', 'select', 'Sales Rep'),
  f('Development access', 'radio', ['All developments', 'Selected developments'], { sel: 1 }),
  f('Developments', 'chips', [['Verdala', 'pri'], ['Onyx Rise', 'pri']], { h: 'Reps only get leads from developments they are on' }),
  f('Reports to', 'select', 'Rachel Mifsud', { h: 'Their approval requests go to this queue' }),
  f('Approval profile', 'radio', ['New rep defaults', 'Trusted rep'], { h: 'The new rep default is still to be agreed (FS-510)', hw: true }),
  f('Mobile for WhatsApp (optional)', 'text', '+356 7955 2031', { h: 'Pre-registers Luke’s number' })] },
  { k: 'note', tone: 'neu', text: 'Invites expire after 7 days (proposed). You can resend or revoke from the list.' }] };
const deactB = (who, rec) => [{ k: 'table', title: `What ${who} owns`, cols: ['Record', 'Open'], gc: '1fr 80px', ra: [1], rows: [['Leads', '14'], ['Opportunities', '6'], ['Deals', '2'], ['Pending hold requests', '1'], ['Tasks', '9']] },
  { k: 'fields', rows: [f('Move everything to', 'radio', ['One person', 'Return leads to rotation']), f('Recipient', 'select', rec)] },
  { k: 'note', tone: 'neu', items: ['The pending hold on Verdala B-12 keeps its queue position.', `Records keep ${who} as original owner in history.`, 'An audit row is written for each move.'] }];
D.deact = { t: 'Deactivate Karl Zammit?', w: 540, d: 'Karl can’t sign in and his WhatsApp number stops being recognised from his next request. You can reactivate him later.', ok: 'Deactivate and move 32 records', danger: true, done: 'Karl Zammit deactivated. 32 records moved to Sarah Azzopardi.', b: deactB('Karl', 'Sarah Azzopardi') };
D['deact-sam'] = { ...D.deact, t: 'Deactivate Sam?', d: 'Sam can’t sign in and his WhatsApp number stops being recognised from his next request.', b: deactB('Sam', 'Karl Zammit') };
D.transfer = { t: 'Transfer ownership', w: 520, d: 'Only the Owner can do this. You become an Admin.', ok: 'Transfer ownership', danger: true, done: 'Claire Azzopardi is now the Owner.', b: [{ k: 'fields', rows: [
  f('New owner', 'select', 'Claire Azzopardi · Admin'), f('Billing contact', 'radio', ['Move to Claire', 'Keep Mark Galea']), f('Type the company name to confirm', 'text', 'Lalex Developments')] }] };
D.signout = { t: 'Sign out everywhere?', d: 'You’ll be signed out on 3 devices, including this one.', ok: 'Sign out everywhere', danger: true, b: [] };
D.changerole = { t: 'Change Sam’s role', ok: 'Change role', done: 'Role changed. Applies on Sam’s next request.', b: [{ k: 'fields', rows: [f('New role', 'select', 'Sales Manager')] }, { k: 'note', tone: 'info', text: 'Applies on Sam’s next request. His open requests keep their route.' }] };

// Notifications (account)
const R5 = (...cells) => cells.map(c => c === 0 ? M('—') : c);
const n3 = (a, w, e, lk) => H(['App', a, lk], ['WA', w, lk], ['Email', e]);
P.notifications = { nav: 'notifications', t: 'Notifications', tag: 'v1', d: 'Who hears about what, and on which channel. Each user can switch off anything that isn’t locked.', menu: [['Reset to defaults'], hist('Notifications')], ban: [{ tone: 'neu', text: 'Locked channels are mandatory and can’t be switched off by the user. For example, approval requests always reach the approving manager.' }], b: [
  { k: 'table', cap: 'settings.notifications.update', cols: ['Event', 'Sales Rep', 'Sales Manager', 'Admin', 'Owner', 'Ops'], gc: '1.5fr repeat(5,minmax(0,1fr))', rows: [
    R5(S('New lead assigned', 'Assigned rep'), n3(1, 1, 0), 0, 0, 0, 0),
    R5(S('First contact overdue', 'Assigned rep, manager'), n3(1, 1, 0), n3(1, 0, 0), 0, 0, 0),
    R5(S('Approval requested', 'Approving manager'), 0, n3(1, 1, 0, 1), 0, 0, 0),
    R5(S('Approval decided', 'Requesting rep'), n3(1, 1, 0, 1), 0, 0, 0, 0),
    R5(S('Unit sold on another deal', 'Affected reps'), n3(1, 1, 0, 1), n3(1, 0, 0), 0, 0, 0),
    R5(S('Unit sold'), 0, n3(1, 0, 0), n3(1, 0, 0), n3(1, 1, 1), 0),
    R5(S('Required document missing at stage'), n3(1, 0, 0), 0, 0, 0, n3(1, 0, 1)),
    R5(S('Payment milestone overdue'), 0, n3(1, 0, 1), 0, 0, n3(1, 0, 1)),
    R5(S('Appointment reminder', 'Listed parties'), n3(1, 1, 0), n3(1, 1, 0), 0, 0, 0),
    R5(S('Credits at 80% or used up'), 0, 0, n3(1, 0, 1), n3(1, 0, 1), 0),
    R5(S('Integration needs attention'), 0, 0, n3(1, 0, 1), 0, 0),
    R5(S('Studio delivery ready', 'Owner, requester'), 0, 0, 0, n3(1, 0, 1), 0)] }] };

// Data and privacy
const DATA_TABS = [['Market rules', 'data'], ['Export', 'data/export'], ['Buyer data requests', 'data/requests']];
P.data = { nav: 'data', t: 'Data and privacy', tag: 'v1', d: 'The rules for how long buyer data is kept and where it lives. None of these are fixed in code.', tabs: DATA_TABS, menu: [hist('Data and privacy')], b: [
  { k: 'fields', title: 'Market rules', desc: 'Pre-filled from Malta, your default market.', cap: 'settings.privacy.update', rows: [
    f('Retention period', 'select', '6 years after a deal closes · 2 years after a lead goes cold', { s: 'Buyer records and documents' }),
    f('Data residency', 'static', 'EU · Frankfurt', { lock: true, h: 'Data exists, so moving is a migration. Contact support to move regions.' }),
    f('Identity documents', 'select', 'Keep for the retention period · Ops and Admins only'),
    f('Source-of-funds records', 'select', 'Keep 5 years after the deal (AML) · Ops and Admins only')] },
  { k: 'note', tone: 'out', nt: 'Data activity', tag: 'Not in PRD', text: 'Imports, bulk changes and exports, with undo, are listed in Data activity.', act: ['Open Data activity', 's:Opening Data activity'] }] };
P['data-edit'] = { ...P.data, b: [{ ...P.data.b[0], rows: [f('Retention period', 'select', '3 years after a deal closes · 1 year after a lead goes cold', { s: 'Buyer records and documents', chip: ['Changed', 'warn'] }), ...P.data.b[0].rows.slice(1)] }, P.data.b[1]] };
P['data/export'] = { nav: 'data', t: 'Data and privacy', tag: 'Not in PRD', d: 'Download everything in your account for your own records or compliance.', cr: 'Data and privacy / Export', tabs: DATA_TABS, acts: [['Request full export', 's:Export requested. We’ll email Mark Galea when the archive is ready.']], b: [
  { k: 'note', tone: 'out', text: 'A full export contains contacts, deals, units, a documents index and the audit log, as a downloadable archive. Every request is logged.' },
  { k: 'table', title: 'Previous exports', cols: ['Requested', 'By', 'Contents', 'Status', ''], gc: '1fr 1fr 2fr 1fr 90px', ra: [4], rows: [
    ['2 Sep 2026, 10:12', 'Mark Galea', 'Full account', C('Ready', 'ok'), K('Download')], ['14 Jul 2026, 16:40', 'Claire Azzopardi', 'Full account', C('Expired', 'neu'), M('')]] }] };
P['data/requests'] = { nav: 'data', t: 'Data and privacy', tag: 'Not in PRD', d: 'Access and deletion requests from buyers. Deletion follows the retention and deal-document rules, so some records are kept with a stated reason.', cr: 'Data and privacy / Buyer data requests', tabs: DATA_TABS, acts: [['Log a request']], b: [
  { k: 'table', cols: ['Contact', 'Type', 'Received', 'Due', 'Status'], gc: '1.4fr 1fr 1fr 1fr 1.6fr', rows: [
    [A('Joe Vella', 'Lead · cold since Mar 2025'), 'Deletion', '18 Sep 2026', '18 Oct 2026', C('Open', 'warn')],
    [A('Maria Borg', 'Buyer · Verdala A-04'), 'Access', '2 Sep 2026', '2 Oct 2026', C('Sent', 'ok')],
    [A('Luca Camilleri', 'Buyer · deed signed'), 'Deletion', '9 Aug 2026', '8 Sep 2026', S('Partly kept', 'Deed documents kept 10 years by law')]] }] };
D.retention = { t: 'Change the retention period?', w: 540, ok: 'Change retention', danger: true, done: 'Retention changed. Audit row written: 6 years → 3 years.', b: [
  { k: 'stats', items: [{ l: 'Current', v: '6 years', s: 'After a deal closes' }, { l: 'New', v: '3 years', s: 'After a deal closes' }] },
  { k: 'note', tone: 'warn', nt: 'What this would remove', items: ['214 closed-deal buyer records older than 3 years, on 1 Nov 2026', '1,380 cold leads older than 1 year, on 1 Nov 2026', 'Deal documents follow their own rules and are not affected'] },
  { k: 'note', tone: 'neu', text: 'Document handling reads the new value from now on. The change is written to the audit log with old and new values.' }] };

// Security
const SEC_TABS = [['Audit log', 'security'], ['Sign-in policy', 'security/signin'], ['Bricly support access', 'security/support']];
const AUD = [
  ['Today, 11:24', A('Claire Azzopardi'), 'Retention changed', 'Market rules', MO('6 years → 3 years'), C('App', 'neu')],
  ['Today, 10:02', A('Rachel Mifsud'), 'Price changed', 'Verdala B-12', MO('€385,000 → €372,000'), C('App', 'neu')],
  ['Today, 09:41', A('Sam'), 'Status changed', 'Verdala B-12', MO('Available → Held'), C('WhatsApp', 'neu')],
  ['Yesterday, 17:10', A('Nina Pace', 'Bricly support'), 'Checklist edited', 'Promise of sale', MO('+ Bank sanction letter'), C('Bricly support', 'info')],
  ['Yesterday, 12:55', A('Claire Azzopardi'), 'Units imported', 'Onyx Rise', MO('16 units'), C('Import', 'neu')],
  ['24 Sep, 16:10', A('Rachel Mifsud'), 'Approval rule', 'Karl Zammit · Hold', MO('Needs approval → Straight through'), C('App', 'neu')]];
P.security = { nav: 'security', t: 'Security', tag: 'v1', d: 'Every change, by anyone, from any source. Nothing here can be edited or deleted.', tabs: SEC_TABS, acts: [['Export CSV']], b: [
  { k: 'table', cap: 'audit.read', search: 'Unit, record or person', filters: ['User', 'Action', 'Source', 'Date'], cols: ['Time', 'Actor', 'Action', 'Record', 'Old → new', 'Source'], gc: '0.9fr 1.3fr 1fr 1fr 1.6fr 0.9fr', rows: AUD }] };
P['security-b12'] = { ...P.security, b: [{ ...P.security.b[0], q: true, search: 'B-12', rows: AUD.filter(r => r[3] === 'Verdala B-12').map((r, i) => ({ c: r, sel: i === 0 })) }], ban: [{ tone: 'info', text: '“Who changed this unit’s price?” Rachel Mifsud, today at 10:02, in the app.' }] };
P['security-ret'] = { ...P.security, b: [{ ...P.security.b[0], filters: [['Record: Market rules'], 'User', 'Source', 'Date'], rows: [{ c: AUD[0], sel: true }, [ '14 Jan 2026, 09:00', A('Nina Pace', 'Bricly support'), 'Retention set', 'Market rules', MO('— → 6 years'), C('Bricly support', 'info')]] }] };
P['security/signin'] = { nav: 'security', t: 'Security', tag: 'Not in PRD', d: 'Buyer financial data and contracts live here. Two-step verification for Owner and Admins is the minimum we recommend.', cr: 'Security / Sign-in policy', tabs: SEC_TABS, b: [
  { k: 'fields', cap: 'settings.security.update', rows: [
    f('Require two-step verification', 'radio', ['Everyone', 'Owner and Admins', 'Off'], { sel: 1 }),
    f('Session length', 'select', '12 hours of inactivity'),
    f('Single sign-on', 'static', 'Not available yet', { h: 'Planned for larger accounts' })] }] };
P['security/support'] = { nav: 'security', t: 'Security', tag: 'Not in PRD', d: 'During onboarding the Bricly team works inside your account. You decide for how long, and every action is logged.', cr: 'Security / Bricly support access', tabs: SEC_TABS, b: [
  { k: 'fields', cap: 'settings.support_access.update', rows: [
    f('Allow Bricly support access', 'toggle', true, { v: 'On · granted by Mark Galea' }),
    f('For', 'radio', ['24 hours', '7 days', 'During onboarding'], { sel: 2 }),
    f('Ends', 'static', 'When onboarding is signed off (expected 21 Nov 2026)')] },
  { k: 'table', title: 'Support activity', desc: 'Written to the audit log with the source Bricly support.', cols: ['When', 'Who', 'What'], gc: '1fr 1fr 2.4fr', rows: [
    ['Yesterday, 17:10', A('Nina Pace'), 'Edited Promise of sale checklist'], ['Yesterday, 16:52', A('Nina Pace'), 'Signed in'], ['26 Sep, 10:05', A('Ben Attard'), 'Loaded 16 units into Onyx Rise']] }] };

// Development settings tab (inheritance)
const INH = (rule, sub, custom) => [S(rule, sub), custom ? C('Custom for this development', 'pri') : C('Using account default', 'neu'), K(custom ? 'Reset to default' : 'Override')];
P.dev = { nav: 'dev', root: 'Developments', cr: 'Verdala / Settings', t: 'Verdala', tag: 'v1', d: 'Settings for this development. Rules inherit the account default until you override them.', back: ['Developments', 'dev'], tabs: [['Overview', 'dev'], ['Units', 'dev'], ['Settings', 'dev']], tab: 'Settings', menu: [['Archive development', 'd:archive', 'danger'], hist('Verdala')], b: [
  { k: 'table', title: 'Inherited rules', cap: 'developments.settings.update', cols: ['Rule', 'Source', ''], gc: '2fr 1.2fr 130px', ra: [2], rows: [
    INH('Documents per closing step', 'Account default · 9 documents'), INH('Payment plan', '10% · 3 instalments · 20% at deed', true), INH('Allocation', 'Rotation across 2 reps'), INH('Pipeline checklists', '')] },
  { k: 'fields', title: 'Lead form', desc: 'One hosted form per development.', rows: [f('Form', 'static', 'lalex.bricly.app/verdala/enquire', { h: 'Edit form' }), f('Fields', 'chips', ['Name', 'Phone', 'Email', 'Bedrooms', 'Budget'])] },
  { k: 'fields', title: 'Flags', rows: [
    f('Share construction updates with buyers', 'toggle', false, { v: 'Off', chip: ['Proposed', 'neu'] }),
    f('Parent brand check', 'toggle', true, { v: 'On', h: 'Takes effect in a later release', hw: true })] }] };
D.archive = { t: 'Archive Verdala?', w: 520, ok: 'Archive Verdala', danger: true, done: 'Verdala archived. It is read-only now; its homes stop counting at renewal.', b: [
  { k: 'note', tone: 'warn', items: ['Verdala becomes read-only now. No new holds, reservations or sales.', 'Its 18 active homes stop counting at your next renewal on 14 Jan 2027, not today.', 'To sell again, the development has to be loaded again.'] }] };

// Scenarios
Object.assign(SC, {
  'g-load': { p: 'company', st: 'loading' }, 'g-noaccess': { p: 'plan', r: 'rep' }, 'g-readonly': { p: 'credits', r: 'manager' }, 'g-concierge': { p: 'sales', con: true },
  'g-snack': { p: 'mynotif', r: 'rep', snack: 'WhatsApp off for First contact overdue', undo: true }, 'g-inherit': { p: 'dev' },
  'g-save': { p: 'approvals', r: 'manager', save: ['2 unsaved changes · Karl Zammit, Hold and Reservation → Straight through', 'REQ-1041 is already waiting and keeps its route. Applies to new requests only.'] },
  'g-leave': { p: 'approvals', r: 'manager', d: 'leave', save: ['2 unsaved changes', 'Applies to new requests only.'] },
  'a-company': { p: 'company', r: 'owner' }, 'a-me': { p: 'me', r: 'rep' }, 'a-sec': { p: 'mysecurity', r: 'rep' }, 'a-cal': { p: 'calendar', r: 'rep' }, 'a-wa': { p: 'mywa', r: 'rep' }, 'a-wa-un': { p: 'mywa-un', r: 'rep' }, 'a-notif': { p: 'mynotif', r: 'rep' },
  't-list': { p: 'team' }, 't-roles': { p: 'team/roles' }, 't-invite': { p: 'team', d: 'invite' }, 't-invited': { p: 'team-invited', snack: '2 invites sent. They expire in 7 days.' },
  't-user': { p: 'user' }, 't-access': { p: 'user/access' }, 't-usage': { p: 'user/usage' }, 't-role': { p: 'user/access', d: 'changerole' },
  't-karl': { p: 'user-karl', menu: true }, 't-deact': { p: 'user-karl', d: 'deact' }, 't-deact-done': { p: 'team-deact', snack: 'Karl Zammit deactivated. 32 records moved to Sarah Azzopardi.' },
  't-transfer': { p: 'team', r: 'owner', d: 'transfer' }, 't-mgr': { p: 'team', r: 'manager' },
  'n-matrix': { p: 'notifications' }, 'd-market': { p: 'data' }, 'd-edit': { p: 'data-edit', save: ['1 unsaved change · Retention period', 'You’ll see what this removes before it saves.'] }, 'd-ret': { p: 'data-edit', d: 'retention' },
  'd-audit': { p: 'security-ret', snack: 'Retention changed. Audit row written.' }, 'd-export': { p: 'data/export' }, 'd-req': { p: 'data/requests' },
  's-audit': { p: 'security' }, 's-audit-b12': { p: 'security-b12' }, 's-signin': { p: 'security/signin' }, 's-support': { p: 'security/support' },
  'dev-archive': { p: 'dev', d: 'archive' },
});
D.leave = { t: 'Leave without saving?', d: 'You have 2 unsaved changes on Approvals.', ok: 'Leave and discard', cancel: 'Keep editing', danger: true, b: [] };
X.a = true;
})();
