create extension if not exists "pgcrypto";

create table if not exists public.questions (
  id text primary key,
  display_order integer not null unique,
  category text not null,
  plain_text_question text not null check (char_length(plain_text_question) > 0),
  risk_weight numeric not null check (risk_weight >= 0),
  effort_level numeric not null check (effort_level >= 0),
  framework_name text not null,
  framework_reference text not null,
  framework_excerpt text not null check (char_length(framework_excerpt) > 0),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_score numeric not null check (total_score >= 0),
  score_percent numeric not null check (score_percent >= 0 and score_percent <= 100),
  high_priority_flags integer not null default 0 check (high_priority_flags >= 0),
  raw_responses jsonb not null,
  failed_question_ids text[] not null default '{}'::text[],
  ai_recommendations text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.questions enable row level security;
alter table public.assessments enable row level security;

drop policy if exists "questions are viewable by authenticated users" on public.questions;
create policy "questions are viewable by authenticated users"
  on public.questions
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "assessments are viewable by owner" on public.assessments;
create policy "assessments are viewable by owner"
  on public.assessments
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "assessments are insertable by owner" on public.assessments;
create policy "assessments are insertable by owner"
  on public.assessments
  for insert
  with check ((select auth.uid()) = user_id);

insert into public.questions (
  id,
  display_order,
  category,
  plain_text_question,
  risk_weight,
  effort_level,
  framework_name,
  framework_reference,
  framework_excerpt
) values
  (
    'q1',
    1,
    'Identify',
    'Do you have an accurate, up-to-date list of all computers, servers, and devices used by your organization?',
    2.0,
    2.0,
    'CIS Controls',
    'CIS Control 1',
    'FRAMEWORK MANDATE: CIS Control 1 explicitly requires organizations to "Actively manage (inventory, track, and correct) all enterprise assets... connected to the infrastructure physically, virtually, remotely, and those within cloud environments". BUSINESS RATIONALE: You cannot defend a network if you do not know what is on it. Shadow IT, employee personal devices (BYOD), and forgotten legacy servers create massive, unmonitored blind spots. IMPLEMENTATION: Organizations should deploy active network discovery tools, passive asset scanners, or Unified Endpoint Management (UEM) solutions to automatically log every device attempting to connect to the network, dynamically updating the inventory rather than relying on static spreadsheets. EXPLOIT SCENARIO: A marketing employee brings a personal, malware-infected laptop to the office and plugs it into a seemingly dead Ethernet wall jack. Because the organization lacks automated network access control and asset tracking, the infected laptop bypasses perimeter firewalls entirely. It silently maps the internal network, locates a forgotten, unpatched Windows 7 print server that IT forgot existed, and uses it as a staging ground to launch a persistent ransomware attack against the primary corporate database.'
  ),
  (
    'q2',
    2,
    'Identify',
    'Are former employees and volunteers locked out of all digital accounts on the exact day they leave?',
    3.0,
    1.0,
    'ISO 27001',
    'ISO/IEC 27001 A.5.18',
    'FRAMEWORK MANDATE: ISO/IEC 27001 A.5.18 mandates the prompt review and immediate revocation of access rights when personnel leave or change roles. BUSINESS RATIONALE: Lingering access by former personnel is a critical vulnerability. Orphaned accounts are not actively monitored, making them prime targets for external hackers and malicious insider threats. IMPLEMENTATION: Organizations must establish a strict, automated offboarding workflow. When HR marks an employee as terminated, an integrated Identity and Access Management (IAM) system should instantly revoke SSO tokens, VPN certificates, cloud storage access, and physical keycard entry simultaneously. EXPLOIT SCENARIO: An unhappy sales director leaves for a direct competitor. Because IT relies on a manual checklist for offboarding, they disable the director''s primary email but forget to revoke their standalone access to the company''s cloud-based Customer Relationship Management (CRM) tool. Two weeks later, the former director logs into the CRM from their home network, exports the entire proprietary client list, pricing models, and pending contracts, and hands the data to their new employer, costing the original company millions in lost revenue.'
  ),
  (
    'q3',
    3,
    'Protect',
    'Do you require two-step verification (MFA) to log into critical systems like email and banking?',
    3.0,
    1.0,
    'CIS Controls',
    'CIS Control 6',
    'FRAMEWORK MANDATE: CIS Control 6 requires organizations to "Use processes and tools to create, assign, manage, and revoke access credentials and privileges", specifically requiring the implementation of Multi-Factor Authentication (MFA). BUSINESS RATIONALE: Passwords alone are fundamentally broken. They are easily guessed, reused across personal and professional sites, and stolen in third-party data breaches. MFA acts as a critical fail-safe. IMPLEMENTATION: Organizations must enforce MFA across all email suites (Google Workspace/M365), VPNs, and financial portals. Phishing-resistant methods like FIDO2 hardware keys or authenticator apps should be prioritized over easily intercepted SMS text messages. EXPLOIT SCENARIO: A hacker purchases a batch of leaked passwords from a dark web forum and discovers a match for the company CFO. Without MFA enabled on the corporate email system, the hacker logs directly into the CFO''s inbox undetected. They spend a week silently reading email threads to learn communication styles, then intercept an ongoing vendor conversation, altering the routing numbers on an attached PDF invoice. The finance team wires $150,000 to the hacker''s offshore account before anyone realizes the breach occurred.'
  ),
  (
    'q4',
    4,
    'Protect',
    'Are your computers and servers set to automatically install software and security updates?',
    3.0,
    1.0,
    'CIS Controls',
    'CIS Control 7',
    'FRAMEWORK MANDATE: CIS Control 7 dictates that organizations must "Develop a plan to continuously assess and track vulnerabilities on all enterprise assets... in order to remediate, and minimize, the window of opportunity for attackers". BUSINESS RATIONALE: Software vendors constantly release patches to fix newly discovered security flaws (CVEs). Attackers actively scan the internet for organizations running outdated, vulnerable software to gain instant administrative control. IMPLEMENTATION: Small businesses should leverage centralized patch management software or Native OS MDM policies to enforce automatic, scheduled updates for operating systems, web browsers, and critical third-party applications. EXPLOIT SCENARIO: A critical vulnerability is publicly disclosed for a popular VPN software used by the organization. The IT team plans to patch it "next weekend." Within 12 hours of the disclosure, an automated botnet scans the company''s public IP address, detects the unpatched VPN gateway, and executes a zero-day exploit. The attacker bypasses all authentication, drops a web shell on the server, and gains a permanent backdoor into the internal network long before the IT team begins their scheduled weekend maintenance.'
  ),
  (
    'q5',
    5,
    'Protect',
    'Do you restrict access to sensitive data only to the specific people who absolutely need it?',
    2.0,
    1.0,
    'NIST CSF',
    'PR.AA-01',
    'FRAMEWORK MANDATE: NIST PR.AA-01 requires that access permissions and authorizations are managed strictly incorporating the principles of least privilege and separation of duties to "protect the confidentiality, integrity, and availability of information". BUSINESS RATIONALE: Defaulting to "open access" for internal documents creates an enormous blast radius during a security incident. If every employee has access to everything, a single compromised low-level account grants an attacker the keys to the entire kingdom. IMPLEMENTATION: Enforce Role-Based Access Control (RBAC). Group employees by department and grant access only to the specific shared drives, databases, and applications necessary for their daily workflow. Conduct quarterly audits to prune access creep. EXPLOIT SCENARIO: A junior graphic designer falls victim to a credential harvesting scam. Because the company file server is configured with global read/write permissions for all authenticated users to "make collaboration easier," the attacker uses the designer''s account to navigate directly into the HR folder. They silently exfiltrate unencrypted W-2 tax forms containing the social security numbers and home addresses of the entire executive board, leading to severe identity theft and regulatory fines.'
  ),
  (
    'q6',
    6,
    'Protect',
    'Do you require the use of a secure password manager or unique, complex passwords for all company accounts?',
    3.0,
    2.0,
    'CIS Controls',
    'CIS Control 5',
    'FRAMEWORK MANDATE: CIS Control 5 requires organizations to "Use processes and tools to assign and manage authorization to credentials for user accounts", mandating complex, unique passwords across all systems. BUSINESS RATIONALE: Password fatigue is a major security risk. When employees are forced to remember dozens of logins, they inevitably resort to using simple passwords and reusing them across personal shopping sites, social media, and corporate portals. IMPLEMENTATION: Deploy an enterprise-grade password manager. This allows employees to generate and securely store cryptographically strong, 16+ character passwords for every service, preventing reuse and securing shared team credentials. EXPLOIT SCENARIO: An employee uses the password "Spring2025!" for both their corporate email and a minor, unsecured fitness tracking app. The fitness app is hacked, and its user database is dumped online. Attackers use automated "credential stuffing" bots to test those leaked emails and passwords across thousands of corporate Microsoft 365 login pages. The bot successfully logs into the employee''s corporate account, immediately begins downloading confidential company data, and uses the account to launch internal phishing attacks against other staff members.'
  ),
  (
    'q7',
    7,
    'Protect',
    'Do your employees receive regular training on how to spot phishing emails and online scams?',
    2.0,
    2.0,
    'NIST CSF',
    'PR.AT-01',
    'FRAMEWORK MANDATE: NIST PR.AT-01 requires that personnel and partners are trained, tested, and maintain awareness of their cybersecurity responsibilities, explicitly "Empowering staff within the organization through Awareness and Training". BUSINESS RATIONALE: Firewalls and antivirus software cannot stop a user from willingly handing over their password. Human error remains the primary entry point for the vast majority of cyberattacks. Continuous training transforms the workforce into an active human firewall. IMPLEMENTATION: Organizations must institute a formal security awareness program. This includes brief, monthly interactive training modules covering current threat trends, combined with unannounced, simulated phishing campaigns to identify high-risk employees. EXPLOIT SCENARIO: During tax season, an untrained payroll clerk receives an urgent email appearing to be from the CEO, requesting a quick review of an attached "Q1 Bonus Distribution" Excel file. The email is actually a highly targeted spear-phishing attack. The clerk clicks the attachment and enables macros, unknowingly executing a malicious script that disables the local antivirus, establishes a command-and-control connection to a foreign server, and gives the attacker full remote control over the clerk''s workstation.'
  ),
  (
    'q8',
    8,
    'Detect & Respond',
    'Do you have active antivirus or anti-malware software running on every company device?',
    3.0,
    1.0,
    'CIS Controls',
    'CIS Control 10',
    'FRAMEWORK MANDATE: CIS Control 10 requires organizations to "Prevent or control the installation, spread, and execution of malicious applications, code, or scripts on enterprise assets" to identify the occurrence of cybersecurity events. BUSINESS RATIONALE: Commodity malware, keyloggers, and automated ransomware scripts are constantly bombarding networks. Without active endpoint protection, malicious processes can execute entirely undetected in the background. IMPLEMENTATION: Migrate from legacy signature-based antivirus to modern Endpoint Detection and Response (EDR) or Next-Generation Antivirus (NGAV) solutions. These tools monitor behavioral anomalies in real-time, instantly killing malicious processes and isolating infected machines. EXPLOIT SCENARIO: A remote employee connects to an unsecured public Wi-Fi network at a coffee shop. An attacker intercepts their traffic and seamlessly injects a malicious "fileless" malware payload directly into the computer''s memory, bypassing traditional disk-based antivirus scans. Because the company does not have behavioral EDR software running, the malware silently hooks into the web browser, records every keystroke, captures the employee''s banking portal credentials, and intercepts live session cookies to bypass MFA.'
  ),
  (
    'q9',
    9,
    'Detect & Respond',
    'If a laptop is stolen or a system is hacked, do you have a written, step-by-step emergency plan on what to do?',
    3.0,
    3.0,
    'NIST CSF',
    'RS.RP-01',
    'FRAMEWORK MANDATE: NIST RS.RP-01 requires that "Response Planning processes are executed during and after an incident" to ensure swift containment and eradication of cyber threats. BUSINESS RATIONALE: The first 24 hours of a cyberattack are chaotic. Without a predefined playbook, IT teams waste critical hours panicking, arguing about jurisdiction, and attempting untested fixes. This delay exponentially increases the damage and financial cost of the breach. IMPLEMENTATION: Develop a formal Incident Response (IR) plan detailing exact roles, out-of-band communication channels, containment protocols (e.g., pulling the server offline vs. monitoring), legal notification obligations, and cyber insurance contact numbers. EXPLOIT SCENARIO: A company discovers an active data breach on their main server at 4:00 PM on a Friday. Lacking a response plan, the junior IT admin panics and immediately deletes the compromised server instances to "stop the bleeding." By doing so, they inadvertently destroy all forensic evidence needed by law enforcement to track the attackers, violate their cyber insurance policy terms causing a claim denial, and fail to realize the attackers had already installed persistence mechanisms on three other servers, leading to a secondary, much worse breach on Monday morning.'
  ),
  (
    'q10',
    10,
    'Recover',
    'Is your most important business data backed up automatically to a separate, offline location at least once a week?',
    3.0,
    3.0,
    'NIST CSF',
    'RC.RP-01',
    'FRAMEWORK MANDATE: NIST RC.RP-01 explicitly demands that organizations "maintain plans for resilience and to restore any capabilities or services that were impaired... to reduce the impact from a cybersecurity incident". BUSINESS RATIONALE: Ransomware is an existential threat to small businesses. If all live data and network-attached backups are encrypted, the organization is completely paralyzed and faced with an extortion demand they cannot afford. Reliable, offline backups are the only guaranteed way to survive. IMPLEMENTATION: Execute the 3-2-1 backup strategy: maintain 3 copies of your data, on 2 different media types, with 1 copy stored securely offsite or in a cryptographically immutable cloud vault that cannot be altered or deleted. EXPLOIT SCENARIO: A sophisticated ransomware gang breaches the corporate network. Before launching the encryption payload, their automated scripts spend two days hunting for network-attached storage (NAS) and shadow volume copies, systematically deleting all accessible corporate backups. When the ransomware finally detonates, it locks the primary servers. Because the company only backed up data to a connected network drive in the server room, everything is lost. With no offline, air-gapped backups to restore from, the company is forced to shut down operations permanently.'
  )
on conflict (id) do update
set
  display_order = excluded.display_order,
  category = excluded.category,
  plain_text_question = excluded.plain_text_question,
  risk_weight = excluded.risk_weight,
  effort_level = excluded.effort_level,
  framework_name = excluded.framework_name,
  framework_reference = excluded.framework_reference,
  framework_excerpt = excluded.framework_excerpt;
  
comment on table public.questions is 'Cybersecurity assessment questions with scoring metadata and framework excerpts for retrieval.';
comment on table public.assessments is 'Saved assessment results and AI-generated recommendations for authenticated users.';
