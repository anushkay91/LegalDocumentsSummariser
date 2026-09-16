import { LegalDocument } from '../types';

export const SAMPLE_DOCUMENTS: LegalDocument[] = [
  {
    id: 'doc-lease-01',
    title: 'Beacon Hill Residential Lease Agreement (Apt 4B)',
    category: 'rental',
    fileName: 'Beacon_Lease_Agreement_2026.pdf',
    fileSize: 142800,
    uploadDate: '2026-08-15T09:30:00.000Z',
    lastAnalyzed: '2026-08-15T09:31:12.000Z',
    status: 'ready',
    rawText: `RESIDENTIAL LEASE AGREEMENT
This Residential Lease Agreement ("Agreement") is made and entered into as of September 1, 2026, by and between Beacon Crest Property Management LLC ("Landlord"), and Alex J. Morgan ("Tenant").

SECTION 1: PREMISES & TERM
1.1 Premises: Landlord leases to Tenant the real property located at 412 Beacon Street, Apartment 4B, Boston, MA 02116.
1.2 Initial Term: The initial term shall commence on September 1, 2026, and shall terminate on August 31, 2027 ("Initial Expiration Date").
1.3 Automatic Renewal: UNLESS TENANT PROVIDES WRITTEN NOTICE OF INTENT TO VACATE VIA REGISTERED OR CERTIFIED MAIL EXACTLY NINETY (90) DAYS PRIOR TO THE INITIAL EXPIRATION DATE (ON OR BEFORE JUNE 2, 2027), THIS AGREEMENT SHALL AUTOMATICALLY RENEW FOR AN ADDITIONAL TWENTY-FOUR (24) MONTH EXTENSION PERIOD AT A RENT ESCALATION OF EIGHT PERCENT (8%) OVER THE PREVIOUS BASE RENT. Electronic mail or oral notice shall not constitute valid notice.

SECTION 2: RENT & SECURITY DEPOSIT
2.1 Monthly Rent: Tenant covenants and agrees to pay monthly base rent of $3,200.00, due on or before the first (1st) calendar day of each month.
2.2 Late Fees: If rent is not received by 11:59 PM on the fifth (5th) calendar day of the month, Tenant shall pay a late fee equal to five percent (5%) of monthly rent ($160.00), plus $15.00 for each additional day rent remains unpaid.
2.3 Security Deposit: Tenant has deposited the sum of $3,200.00 as security. Landlord shall hold this in an escrow account. The deposit shall be returned within thirty (30) days post-moveout, provided Tenant returns all original keys and access fobs prior to 10:00 AM on August 31, 2027. Failure to return fobs by said deadline shall result in liquidated damages in the full amount of the deposit.

SECTION 3: MAINTENANCE, UTILITIES & REPAIRS
3.1 Minor Repairs: Tenant shall be solely responsible for all maintenance, plumbing unclogging, HVAC filter replacements, and any single repair cost under $300.00 per occurrence, irrespective of pre-existing condition or ordinary wear and tear.
3.2 Utilities: Tenant shall arrange and pay directly for electricity, gas, and internet. Water and municipal sewer shall be billed quarterly by Landlord with a ten percent (10%) administrative processing fee.

SECTION 4: LANDLORD RIGHT OF ENTRY
4.1 Inspection Rights: Landlord and Landlord's designated contractors or prospective buyers reserve the right to enter the Premises at any hour between 8:00 AM and 8:00 PM for the purpose of general inspection, routine photographic documentation, or showing the property, without advance notice to Tenant. Emergency entry may occur at any time without notice.

SECTION 5: SUBLETTING & ALTERATIONS
5.1 Prohibition on Subletting: Tenant shall not assign, sublease, or permit short-term rental (including Airbnb or VRBO) under any circumstances. Any unauthorized occupant residing in the unit for more than three (3) consecutive nights shall incur a penalty fee of $100.00 per night.

SECTION 6: GOVERNING LAW & DISPUTES
6.1 Governing Law: This Agreement shall be governed by the laws of the Commonwealth of Massachusetts.
6.2 Attorney's Fees: In any legal proceeding arising out of or related to this Agreement, Tenant agrees to indemnify Landlord for all reasonable attorney's fees and court costs incurred by Landlord.`,
    metadata: {
      parties: [
        { name: 'Beacon Crest Property Management LLC', role: 'Landlord / Lessor' },
        { name: 'Alex J. Morgan', role: 'Tenant / Lessee' }
      ],
      effectiveDate: '2026-09-01',
      expirationDate: '2027-08-31',
      governingLaw: 'Commonwealth of Massachusetts',
      jurisdiction: 'Suffolk County, Massachusetts',
      termLength: '12 Months (with 24-month automatic renewal condition)',
      summary: 'Standard residential apartment lease for Unit 4B at 412 Beacon Street. Contains strict automatic renewal notice terms (90-day certified mail), minor repair cost-shifting to tenant (<$300), and broad landlord entry clauses.'
    },
    extractedSections: [
      {
        id: 'sec-lease-1',
        sectionNumber: '1.3',
        title: 'Automatic Renewal and Extension Terms',
        page: 1,
        verbatimQuote: 'UNLESS TENANT PROVIDES WRITTEN NOTICE OF INTENT TO VACATE VIA REGISTERED OR CERTIFIED MAIL EXACTLY NINETY (90) DAYS PRIOR TO THE INITIAL EXPIRATION DATE... THIS AGREEMENT SHALL AUTOMATICALLY RENEW FOR AN ADDITIONAL TWENTY-FOUR (24) MONTH EXTENSION PERIOD AT A RENT ESCALATION OF EIGHT PERCENT (8%)',
        plainEnglish: 'If you do not send a formal certified letter 90 days before lease end (by June 2, 2027), your lease locks in for another 2 full years with an 8% rent hike. Email or verbal notice is not accepted.',
        category: 'termination'
      },
      {
        id: 'sec-lease-2',
        sectionNumber: '2.3',
        title: 'Security Deposit Return & Key Return Penalty',
        page: 1,
        verbatimQuote: 'Failure to return fobs by said deadline [10:00 AM on August 31, 2027] shall result in liquidated damages in the full amount of the deposit.',
        plainEnglish: 'If keys or fobs are not turned in before 10:00 AM on your final day, the agreement states the entire $3,200 deposit is forfeited as liquidated damages.',
        category: 'financial'
      },
      {
        id: 'sec-lease-3',
        sectionNumber: '3.1',
        title: 'Tenant Obligation for Minor Repairs Under $300',
        page: 2,
        verbatimQuote: 'Tenant shall be solely responsible for all maintenance, plumbing unclogging, HVAC filter replacements, and any single repair cost under $300.00 per occurrence, irrespective of pre-existing condition or ordinary wear and tear.',
        plainEnglish: 'You are obligated to pay for any repair costing up to $300, even if the wear was pre-existing or standard wear and tear.',
        category: 'obligation'
      },
      {
        id: 'sec-lease-4',
        sectionNumber: '4.1',
        title: 'Landlord Entry Without Advance Notice',
        page: 2,
        verbatimQuote: 'Landlord... reserve the right to enter the Premises at any hour between 8:00 AM and 8:00 PM for the purpose of general inspection... without advance notice to Tenant.',
        plainEnglish: 'The landlord reserves the right to enter your home anytime between 8 AM and 8 PM for inspections or showings without giving 24 or 48 hours advance notice.',
        category: 'liability'
      }
    ],
    obligations: [
      {
        id: 'ob-lease-1',
        party: 'user',
        partyName: 'Alex J. Morgan (Tenant)',
        title: 'Submit Certified Mail Vacate Notice 90 Days Early',
        description: 'Send formal written notice via registered/certified mail on or before June 2, 2027 if planning not to renew.',
        severity: 'critical',
        frequency: 'one-time',
        sourceSection: 'Section 1.3',
        sourceQuote: 'UNLESS TENANT PROVIDES WRITTEN NOTICE OF INTENT TO VACATE VIA REGISTERED OR CERTIFIED MAIL EXACTLY NINETY (90) DAYS PRIOR'
      },
      {
        id: 'ob-lease-2',
        party: 'user',
        partyName: 'Alex J. Morgan (Tenant)',
        title: 'Pay Monthly Base Rent',
        description: 'Pay $3,200 base rent on or before the 1st of every month.',
        severity: 'standard',
        frequency: 'recurring',
        sourceSection: 'Section 2.1',
        sourceQuote: 'Tenant covenants and agrees to pay monthly base rent of $3,200.00, due on or before the first (1st) calendar day of each month.'
      },
      {
        id: 'ob-lease-3',
        party: 'user',
        partyName: 'Alex J. Morgan (Tenant)',
        title: 'Cover Out-of-Pocket Repairs up to $300',
        description: 'Pay repair costs up to $300 per incident, including plumbing or HVAC filters.',
        severity: 'moderate',
        frequency: 'conditional',
        sourceSection: 'Section 3.1',
        sourceQuote: 'Tenant shall be solely responsible for all maintenance... under $300.00 per occurrence'
      },
      {
        id: 'ob-lease-4',
        party: 'counterparty',
        partyName: 'Beacon Crest Property Management LLC',
        title: 'Return Security Deposit Within 30 Days',
        description: 'Return the $3,200 escrow deposit within 30 days of lease expiration, subject to key return terms.',
        severity: 'standard',
        frequency: 'one-time',
        sourceSection: 'Section 2.3',
        sourceQuote: 'The deposit shall be returned within thirty (30) days post-moveout'
      }
    ],
    deadlines: [
      {
        id: 'dl-lease-1',
        title: 'Certified Non-Renewal Notice Deadline',
        dueDate: '2027-06-02',
        isRelative: false,
        actionRequired: 'Deliver certified/registered mail notice of intent to vacate',
        consequenceIfMissed: 'Automatic 24-month lease extension with 8% rent escalation to $3,456/mo',
        urgency: 'urgent',
        sourceSection: 'Section 1.3',
        sourceQuote: 'EXACTLY NINETY (90) DAYS PRIOR TO THE INITIAL EXPIRATION DATE (ON OR BEFORE JUNE 2, 2027)',
        completed: false
      },
      {
        id: 'dl-lease-2',
        title: 'Monthly Rent Payment Due',
        dueDate: '1st of every month',
        isRelative: true,
        relativeTrigger: 'Recurring monthly cycle',
        actionRequired: 'Pay $3,200.00 to Beacon Crest portal',
        consequenceIfMissed: '5% late fee ($160) + $15/day after the 5th',
        urgency: 'upcoming',
        sourceSection: 'Section 2.1 & 2.2',
        sourceQuote: 'due on or before the first (1st) calendar day of each month',
        completed: false
      },
      {
        id: 'dl-lease-3',
        title: 'Final Move-Out & Key Return Deadline',
        dueDate: '2027-08-31T10:00:00',
        isRelative: false,
        actionRequired: 'Surrender all keys and building fobs to management office',
        consequenceIfMissed: 'Total forfeiture of $3,200 security deposit as liquidated damages',
        urgency: 'distant',
        sourceSection: 'Section 2.3',
        sourceQuote: 'prior to 10:00 AM on August 31, 2027. Failure to return fobs by said deadline shall result in liquidated damages in the full amount of the deposit',
        completed: false
      }
    ],
    financialCommitments: [
      {
        id: 'fin-lease-1',
        type: 'payment',
        amount: '$3,200.00',
        schedule: 'Monthly on 1st',
        description: 'Base residential rent',
        sourceSection: 'Section 2.1',
        sourceQuote: 'monthly base rent of $3,200.00'
      },
      {
        id: 'fin-lease-2',
        type: 'deposit',
        amount: '$3,200.00',
        schedule: 'At signing / held in escrow',
        description: 'Security deposit held by Landlord',
        sourceSection: 'Section 2.3',
        sourceQuote: 'deposited the sum of $3,200.00 as security'
      },
      {
        id: 'fin-lease-3',
        type: 'penalty',
        amount: 'Full $3,200 deposit forfeiture',
        schedule: 'If keys returned after 10 AM on move-out',
        description: 'Liquidated damages clause for late key return',
        sourceSection: 'Section 2.3',
        sourceQuote: 'liquidated damages in the full amount of the deposit'
      },
      {
        id: 'fin-lease-4',
        type: 'escalation',
        amount: '8% increase ($3,456/mo)',
        schedule: 'Upon auto-renewal after Aug 31, 2027',
        description: 'Automatic rent increase for 24-month renewal term',
        sourceSection: 'Section 1.3',
        sourceQuote: 'rent escalation of eight percent (8%) over the previous base rent'
      }
    ],
    attentionItems: [
      {
        id: 'att-lease-1',
        category: 'renewal_trap',
        priority: 'high',
        headline: '24-Month Automatic Renewal Lock-In with Strict Certified Mail Requirement',
        whyAttention: 'This clause contains an automatic extension that locks the tenant into two additional years if notice is not delivered 90 days in advance via certified mail. Standard email or telephone notice is explicitly excluded.',
        verbatimQuote: 'UNLESS TENANT PROVIDES WRITTEN NOTICE OF INTENT TO VACATE VIA REGISTERED OR CERTIFIED MAIL EXACTLY NINETY (90) DAYS PRIOR... THIS AGREEMENT SHALL AUTOMATICALLY RENEW FOR AN ADDITIONAL TWENTY-FOUR (24) MONTH EXTENSION PERIOD',
        sourceSection: 'Section 1.3',
        pageNumber: 1,
        suggestedQuestions: [
          'Can we amend this clause to allow 30 or 60 days notice via email?',
          'Is the renewal term negotiable to month-to-month or a single 12-month period rather than 24 months?',
          'What are local statutory tenant protections regarding automatic renewal clauses under Massachusetts General Laws c. 186?'
        ],
        status: 'unreviewed'
      },
      {
        id: 'att-lease-2',
        category: 'harsh_penalty',
        priority: 'high',
        headline: 'Disproportionate Deposit Forfeiture for Late Key Return',
        whyAttention: 'This clause penalizes late key return by claiming the entire $3,200 deposit as liquidated damages even if the premises are completely vacated on time.',
        verbatimQuote: 'Failure to return fobs by said deadline [10:00 AM] shall result in liquidated damages in the full amount of the deposit.',
        sourceSection: 'Section 2.3',
        pageNumber: 1,
        suggestedQuestions: [
          'Can this penalty be capped at the actual reasonable rekeying/fob replacement cost (e.g. $75)?',
          'Is a total deposit forfeiture enforceable under state residential security deposit statutes?'
        ],
        status: 'discuss_with_counsel'
      },
      {
        id: 'att-lease-3',
        category: 'unilateral_right',
        priority: 'medium',
        headline: 'Landlord Entry Without Any Advance Notice for Routine Inspection',
        whyAttention: 'The lease permits landlord or buyer entry between 8 AM and 8 PM for general inspection with zero prior notice, which may conflict with reasonable privacy expectations or local quiet enjoyment standards.',
        verbatimQuote: 'reserve the right to enter the Premises at any hour between 8:00 AM and 8:00 PM for the purpose of general inspection... without advance notice to Tenant.',
        sourceSection: 'Section 4.1',
        pageNumber: 2,
        suggestedQuestions: [
          'Can we insert standard language requiring at least 24 hours advance written notice except in bona fide emergencies?',
          'Does this clause comply with the covenant of quiet enjoyment under Massachusetts law?'
        ],
        status: 'unreviewed'
      }
    ],
    inconsistencies: [
      {
        id: 'inc-lease-1',
        title: 'Certified Mail 90-Day Notice vs General Section 6 Notice Standard',
        description: 'Section 1.3 strictly requires certified or registered mail for non-renewal notice, but Section 6 fails to specify address or delivery criteria for formal legal notices.',
        conflictingSections: [
          {
            section: 'Section 1.3',
            quote: 'NOTICE OF INTENT TO VACATE VIA REGISTERED OR CERTIFIED MAIL EXACTLY NINETY (90) DAYS PRIOR'
          },
          {
            section: 'Section 6.1',
            quote: 'This Agreement shall be governed by the laws of the Commonwealth of Massachusetts.'
          }
        ],
        notesForDiscussion: 'Clarify with property management whether electronic portal confirmation or email to the designated property manager can be accepted alongside certified mail.'
      }
    ]
  },
  {
    id: 'doc-emp-02',
    title: 'Senior Software Engineer Employment & IP Agreement',
    category: 'employment',
    fileName: 'ApexLabs_Employment_Agreement_AlexMorgan.pdf',
    fileSize: 228400,
    uploadDate: '2026-07-10T14:15:00.000Z',
    lastAnalyzed: '2026-07-10T14:16:45.000Z',
    status: 'ready',
    rawText: `EMPLOYMENT & PROPRIETARY INVENTIONS AGREEMENT
This Employment Agreement ("Agreement") is dated June 15, 2026, by and between Apex Intelligence Systems Inc. ("Company") and Jordan Rivera ("Employee").

RECITALS
Company wishes to employ Employee as Senior Staff Engineer, and Employee wishes to accept such employment upon the terms hereinafter set forth.

SECTION 1: POSITION & DUTIES
1.1 Title: Employee shall serve as Senior Staff Engineer reporting to the Vice President of Engineering.
1.2 Full Time Commitment: Employee agrees to devote full business time, attention, and energies exclusively to Company business. Employee shall not engage in any outside advisory, consulting, freelance development, or secondary employment without prior written consent from the Chief Executive Officer.

SECTION 2: COMPENSATION & BENEFITS
2.1 Base Salary: Company shall pay Employee a base salary of $195,000.00 per annum, payable semi-monthly.
2.2 Equity Incentive: Subject to Board approval, Employee shall receive an option grant to purchase 40,000 shares of Common Stock, vesting over four (4) years with a one-year cliff.
2.3 Paid Time Off: Employee is eligible for twenty (20) days of PTO annually. Accrued unused PTO shall not carry over across calendar years.

SECTION 3: INTELLECTUAL PROPERTY & PROPRIETARY RIGHTS
3.1 Assignment of Inventions: Employee hereby assigns and transfers to Company all rights, title, and interest in and to any and all inventions, designs, software, models, algorithms, trade secrets, and copyrighted works conceived, created, or reduced to practice by Employee, solely or jointly with others, during the term of employment, whether or not conceived on Company premises, whether or not conceived during normal working hours, and whether or not related to Company's current products or anticipated lines of business.
3.2 Prior Inventions: All prior inventions created before employment must be listed on Exhibit A. Any inventions not specifically listed on Exhibit A shall be irrevocably presumed to be property of Company.

SECTION 4: NON-COMPETITION & NON-SOLICITATION
4.1 Non-Compete: During employment and for a period of eighteen (18) months following termination of employment for any reason (whether voluntary or involuntary), Employee shall not directly or indirectly engage in, perform services for, invest in, advise, or be employed by any entity operating in the software, artificial intelligence, cloud computing, or distributed systems industries worldwide.
4.2 Non-Solicitation of Personnel: For a period of twenty-four (24) months following termination, Employee shall not solicit, encourage, or recruit any employee, contractor, or consultant of Company to leave Company.

SECTION 5: TERMINATION OF EMPLOYMENT
5.1 At-Will Employment: Employment is at-will. Either party may terminate employment with thirty (30) days advance written notice.
5.2 Resignation Notice & PTO Forfeiture: Notwithstanding Section 5.1, if Employee resigns voluntarily, Employee must provide sixty (60) days advance written notice. During said 60-day period, Company may place Employee on unpaid administrative relief. Furthermore, voluntary resignation shall result in forfeiture of any accrued but unpaid bonuses and all unused PTO days.

SECTION 6: GOVERNING LAW & ARBITRATION
6.1 Governing Law: This Agreement shall be governed by Delaware law, without regard to conflict of laws principles.
6.2 Mandatory Arbitration: Any controversy or dispute shall be resolved through confidential, binding arbitration in Wilmington, Delaware.`,
    metadata: {
      parties: [
        { name: 'Apex Intelligence Systems Inc.', role: 'Employer / Company' },
        { name: 'Jordan Rivera', role: 'Employee' }
      ],
      effectiveDate: '2026-06-15',
      governingLaw: 'State of Delaware',
      jurisdiction: 'Wilmington, Delaware',
      termLength: 'At-will (subject to 60-day resignation notice)',
      summary: 'Executive-level software engineer employment agreement. Contains expansive intellectual property assignment covering off-hours side projects, an 18-month worldwide non-compete clause, and conflicting termination notice periods.'
    },
    extractedSections: [
      {
        id: 'sec-emp-1',
        sectionNumber: '3.1',
        title: 'Comprehensive Assignment of All Inventions & Side Projects',
        page: 2,
        verbatimQuote: 'Employee hereby assigns... all inventions, designs, software, models, algorithms... conceived, created, or reduced to practice... whether or not conceived on Company premises, whether or not conceived during normal working hours, and whether or not related to Company\'s current products',
        plainEnglish: 'The company claims ownership of everything you code or invent during your employment, even on weekends, using your own laptop, and completely unrelated to the company\'s business.',
        category: 'ip'
      },
      {
        id: 'sec-emp-2',
        sectionNumber: '4.1',
        title: '18-Month Worldwide Non-Competition Restriction',
        page: 3,
        verbatimQuote: 'for a period of eighteen (18) months following termination... Employee shall not directly or indirectly engage in, perform services for... any entity operating in the software, artificial intelligence, cloud computing, or distributed systems industries worldwide.',
        plainEnglish: 'Restricts you from working for any software, AI, or cloud company anywhere in the world for 1.5 years after leaving, regardless of whether you resigned or were laid off.',
        category: 'liability'
      },
      {
        id: 'sec-emp-3',
        sectionNumber: '5.2',
        title: '60-Day Resignation Notice & Unpaid Administrative Relief',
        page: 3,
        verbatimQuote: 'if Employee resigns voluntarily, Employee must provide sixty (60) days advance written notice. During said 60-day period, Company may place Employee on unpaid administrative relief. Furthermore, voluntary resignation shall result in forfeiture of... all unused PTO days.',
        plainEnglish: 'If you quit, you must give 2 months notice. The company can immediately bench you without pay for those 60 days and cancel your earned vacation pay.',
        category: 'termination'
      }
    ],
    obligations: [
      {
        id: 'ob-emp-1',
        party: 'user',
        partyName: 'Jordan Rivera (Employee)',
        title: 'Devote Full Business Time & Refrain from Outside Projects',
        description: 'Devote exclusive business energy to Apex and obtain CEO consent before any outside coding, consulting, or advisory.',
        severity: 'standard',
        frequency: 'recurring',
        sourceSection: 'Section 1.2',
        sourceQuote: 'Employee agrees to devote full business time, attention, and energies exclusively to Company business.'
      },
      {
        id: 'ob-emp-2',
        party: 'user',
        partyName: 'Jordan Rivera (Employee)',
        title: 'List All Prior Personal Inventions on Exhibit A',
        description: 'Formally catalog any pre-existing code, projects, or patents before signing to prevent automatic company ownership.',
        severity: 'critical',
        frequency: 'one-time',
        sourceSection: 'Section 3.2',
        sourceQuote: 'Any inventions not specifically listed on Exhibit A shall be irrevocably presumed to be property of Company.'
      },
      {
        id: 'ob-emp-3',
        party: 'user',
        partyName: 'Jordan Rivera (Employee)',
        title: 'Provide 60 Days Written Resignation Notice',
        description: 'Provide 60 days written notice before departing voluntarily.',
        severity: 'critical',
        frequency: 'conditional',
        sourceSection: 'Section 5.2',
        sourceQuote: 'if Employee resigns voluntarily, Employee must provide sixty (60) days advance written notice.'
      }
    ],
    deadlines: [
      {
        id: 'dl-emp-1',
        title: 'Resignation Notice Window',
        dueDate: '60 days prior to departure date',
        isRelative: true,
        relativeTrigger: 'Voluntary resignation decision',
        actionRequired: 'Deliver written resignation letter to VP of Engineering & HR',
        consequenceIfMissed: 'Potential breach claim; forfeiture of accrued PTO & bonuses; unpaid administrative relief',
        urgency: 'upcoming',
        sourceSection: 'Section 5.2',
        sourceQuote: 'Employee must provide sixty (60) days advance written notice',
        completed: false
      },
      {
        id: 'dl-emp-2',
        title: 'Prior Inventions Declaration Deadline',
        dueDate: 'Prior to employment commencement',
        isRelative: true,
        relativeTrigger: 'Contract signing date',
        actionRequired: 'Complete and sign Exhibit A listing all side projects, open source repos, and patents',
        consequenceIfMissed: 'Unlisted inventions are irrevocably claimed as company property',
        urgency: 'urgent',
        sourceSection: 'Section 3.2',
        sourceQuote: 'All prior inventions created before employment must be listed on Exhibit A',
        completed: false
      }
    ],
    financialCommitments: [
      {
        id: 'fin-emp-1',
        type: 'payment',
        amount: '$195,000.00 / year',
        schedule: 'Semi-monthly payroll',
        description: 'Base salary compensation',
        sourceSection: 'Section 2.1',
        sourceQuote: 'base salary of $195,000.00 per annum, payable semi-monthly'
      },
      {
        id: 'fin-emp-2',
        type: 'penalty',
        amount: 'Forfeiture of all accrued unused PTO days',
        schedule: 'Upon voluntary resignation',
        description: 'Loss of earned vacation payout',
        sourceSection: 'Section 5.2',
        sourceQuote: 'voluntary resignation shall result in forfeiture of any accrued but unpaid bonuses and all unused PTO days'
      }
    ],
    attentionItems: [
      {
        id: 'att-emp-1',
        category: 'unilateral_right',
        priority: 'high',
        headline: 'Overreaching IP Assignment Covering Off-Duty Personal Projects',
        whyAttention: 'Section 3.1 claims company ownership over inventions conceived outside normal working hours, off company premises, and completely unrelated to company business. Many jurisdictions (e.g. California Labor Code § 2870, Washington, Illinois) restrict such employer claims.',
        verbatimQuote: 'whether or not conceived on Company premises, whether or not conceived during normal working hours, and whether or not related to Company\'s current products',
        sourceSection: 'Section 3.1',
        pageNumber: 2,
        suggestedQuestions: [
          'Can this clause be restricted to inventions developed using company equipment, trade secrets, or directly relating to company business?',
          'How does Delaware governing law interact with state employee invention protection statutes where the employee physically resides?',
          'Are open-source contributions or personal hobby apps explicitly carved out?'
        ],
        status: 'discuss_with_counsel'
      },
      {
        id: 'att-emp-2',
        category: 'unusual_term',
        priority: 'high',
        headline: 'Broad 18-Month Global Non-Compete in Software and AI',
        whyAttention: 'The covenant bars working for any software, AI, or cloud entity worldwide for 18 months. Non-competes face intense regulatory scrutiny (e.g. FTC rules, California Cal. Bus. & Prof. Code § 16600, Massachusetts Noncompetition Agreement Act).',
        verbatimQuote: 'for a period of eighteen (18) months... Employee shall not directly or indirectly engage in... any entity operating in the software, artificial intelligence, cloud computing, or distributed systems industries worldwide.',
        sourceSection: 'Section 4.1',
        pageNumber: 3,
        suggestedQuestions: [
          'Is this non-compete enforceable in the employee\'s home state?',
          'Does the company offer "garden leave" compensation during the 18-month non-compete period?',
          'Can the scope be narrowed to direct named competitors rather than the entire software industry?'
        ],
        status: 'discuss_with_counsel'
      },
      {
        id: 'att-emp-3',
        category: 'harsh_penalty',
        priority: 'medium',
        headline: '60-Day Resignation Notice with Unpaid Benched Relief & PTO Forfeiture',
        whyAttention: 'Requiring 60 days notice while granting the employer the option to place the employee on UNPAID relief creates an asymmetry where the employee cannot work elsewhere yet receives no pay.',
        verbatimQuote: 'Company may place Employee on unpaid administrative relief. Furthermore, voluntary resignation shall result in forfeiture of... all unused PTO days.',
        sourceSection: 'Section 5.2',
        pageNumber: 3,
        suggestedQuestions: [
          'If the company relieves the employee of duties during notice, must it be paid administrative leave?',
          'Is forfeiture of accrued PTO permitted under applicable state wage payment laws?'
        ],
        status: 'unreviewed'
      }
    ],
    inconsistencies: [
      {
        id: 'inc-emp-1',
        title: 'Conflict Between 30-Day Mutual Notice (5.1) and 60-Day Resignation Notice (5.2)',
        description: 'Section 5.1 states that either party may terminate at-will employment with 30 days advance notice. However, Section 5.2 overrides this for the employee by demanding 60 days advance written notice with severe penalties.',
        conflictingSections: [
          {
            section: 'Section 5.1',
            quote: 'Either party may terminate employment with thirty (30) days advance written notice.'
          },
          {
            section: 'Section 5.2',
            quote: 'Notwithstanding Section 5.1, if Employee resigns voluntarily, Employee must provide sixty (60) days advance written notice.'
          }
        ],
        notesForDiscussion: 'Request alignment so that notice requirements are symmetrical (e.g., standard 14 or 30 days for both parties, with paid garden leave if employer asks employee not to work the notice period).'
      }
    ]
  },
  {
    id: 'doc-nda-03',
    title: 'Vanguard Partners Strategic Advisory Mutual NDA',
    category: 'nda',
    fileName: 'Vanguard_Partners_Mutual_NDA_2026.pdf',
    fileSize: 98200,
    uploadDate: '2026-09-01T11:00:00.000Z',
    lastAnalyzed: '2026-09-01T11:01:22.000Z',
    status: 'ready',
    rawText: `NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT
This Non-Disclosure Agreement ("Agreement") is entered into as of September 1, 2026, by and between Vanguard Ventures LLC ("Disclosing Party" or "Company") and Taylor Chen ("Recipient" or "Advisor").

1. PURPOSE
The parties wish to explore a potential strategic advisory and consulting relationship concerning financial technology and AI asset allocation ("Purpose").

2. CONFIDENTIAL INFORMATION
2.1 Scope: "Confidential Information" shall mean all proprietary, technical, operational, financial, and strategic information disclosed by Vanguard to Advisor. Information disclosed orally shall be deemed confidential if identified as such at the time of disclosure and summarized in writing within thirty (30) days.
2.2 Exclusions: Confidential Information does not include information that: (a) is or becomes publicly known through no breach of Recipient; (b) was already in Recipient's rightful possession without restriction prior to disclosure; or (c) is independently developed without reference to Discloser's information.

3. ASYMMETRIC OBLIGATIONS & DURATION
3.1 Recipient Obligations: Recipient shall hold all Company Confidential Information in strict trust and confidence for a term of five (5) years following the date of disclosure; provided, however, that any trade secrets or source code shall be kept confidential in perpetuity.
3.2 Company Obligations: Any materials or advisory models disclosed by Advisor to Company shall be protected for a duration not to exceed twelve (12) months from the date of disclosure.

4. NON-SOLICITATION OF COMPANY PERSONNEL
4.1 For a period of twenty-four (24) months following the termination of discussions, Advisor covenants and agrees not to solicit, entice, hire, or engage any employee, officer, or contractor of Company, whether directly or indirectly, including responding to general un-targeted employment advertisements.

5. REMEDIES & DISPUTE RESOLUTION
5.1 Injunction: The parties acknowledge that any breach of this Agreement by Recipient would cause irreparable harm for which monetary damages alone would be inadequate, entitling Company to immediate preliminary injunctive relief without posting bond or proof of actual damages.
5.2 Governing Law: This Agreement shall be construed under the laws of the State of Delaware.
5.3 Venue & Fee Shifting: Any proceeding shall be instituted exclusively in the Court of Chancery in Wilmington, Delaware. The prevailing party in any action shall be entitled to recover from the non-prevailing party all reasonable attorneys' fees and expenses.`,
    metadata: {
      parties: [
        { name: 'Vanguard Ventures LLC', role: 'Company / Disclosing Party' },
        { name: 'Taylor Chen', role: 'Advisor / Recipient' }
      ],
      effectiveDate: '2026-09-01',
      governingLaw: 'State of Delaware',
      jurisdiction: 'Court of Chancery in Wilmington, Delaware',
      termLength: '5 Years for Recipient / 1 Year for Company (Trade secrets in perpetuity)',
      summary: 'Purportedly mutual non-disclosure agreement with highly asymmetric confidentiality terms (5 years for Advisor vs 1 year for Vanguard), a 24-month strict non-solicitation clause, and waiver of injunction bond requirements.'
    },
    extractedSections: [
      {
        id: 'sec-nda-1',
        sectionNumber: '3.1 & 3.2',
        title: 'Asymmetric Confidentiality Duration (5 Years vs 1 Year)',
        page: 1,
        verbatimQuote: 'Recipient shall hold all Company Confidential Information in strict trust and confidence for a term of five (5) years... Any materials or advisory models disclosed by Advisor to Company shall be protected for a duration not to exceed twelve (12) months',
        plainEnglish: 'Despite being labeled a "Mutual" NDA, you must keep their secrets confidential for 5 years (and trade secrets forever), but they only need to protect your secrets for 1 year.',
        category: 'liability'
      },
      {
        id: 'sec-nda-2',
        sectionNumber: '4.1',
        title: '2-Year Broad Non-Solicitation Even from General Job Ads',
        page: 2,
        verbatimQuote: 'Advisor covenants and agrees not to solicit, entice, hire, or engage any employee... including responding to general un-targeted employment advertisements.',
        plainEnglish: 'Bars you from hiring any Vanguard employee for 2 years, even if they independently apply to a public job posting your company posted online.',
        category: 'obligation'
      },
      {
        id: 'sec-nda-3',
        sectionNumber: '5.1',
        title: 'Immediate Injunction Without Proof of Damage or Bond',
        page: 2,
        verbatimQuote: 'entitling Company to immediate preliminary injunctive relief without posting bond or proof of actual damages.',
        plainEnglish: 'Allows the company to seek an immediate court injunction stopping your work without needing to prove actual financial harm or post a cash bond to protect you.',
        category: 'dispute'
      }
    ],
    obligations: [
      {
        id: 'ob-nda-1',
        party: 'user',
        partyName: 'Taylor Chen (Advisor)',
        title: 'Maintain Confidentiality for 5 Years',
        description: 'Hold all disclosed Vanguard materials strictly confidential for 5 years; trade secrets in perpetuity.',
        severity: 'standard',
        frequency: 'recurring',
        sourceSection: 'Section 3.1',
        sourceQuote: 'Recipient shall hold all Company Confidential Information in strict trust and confidence for a term of five (5) years'
      },
      {
        id: 'ob-nda-2',
        party: 'user',
        partyName: 'Taylor Chen (Advisor)',
        title: 'Do Not Hire Vanguard Personnel for 24 Months',
        description: 'Refrain from hiring or engaging any Vanguard staff, even through blind job postings, for 2 years.',
        severity: 'moderate',
        frequency: 'recurring',
        sourceSection: 'Section 4.1',
        sourceQuote: 'Advisor covenants and agrees not to solicit, entice, hire, or engage any employee... for a period of twenty-four (24) months'
      },
      {
        id: 'ob-nda-3',
        party: 'counterparty',
        partyName: 'Vanguard Ventures LLC',
        title: 'Protect Advisor Materials for 12 Months',
        description: 'Protect Advisor confidential information for up to 12 months.',
        severity: 'standard',
        frequency: 'recurring',
        sourceSection: 'Section 3.2',
        sourceQuote: 'Any materials or advisory models disclosed by Advisor to Company shall be protected for a duration not to exceed twelve (12) months'
      }
    ],
    deadlines: [
      {
        id: 'dl-nda-1',
        title: 'Oral Disclosure Written Summary Window',
        dueDate: 'Within 30 days of oral conversation',
        isRelative: true,
        relativeTrigger: 'Any verbal meeting or discussion',
        actionRequired: 'Provide written summary of oral disclosures to preserve confidentiality status',
        consequenceIfMissed: 'Information might lose trade secret/confidential protection under Section 2.1',
        urgency: 'upcoming',
        sourceSection: 'Section 2.1',
        sourceQuote: 'summarized in writing within thirty (30) days',
        completed: false
      },
      {
        id: 'dl-nda-2',
        title: 'Company Confidentiality Expiration',
        dueDate: '2027-09-01',
        isRelative: false,
        actionRequired: 'Review what proprietary models were shared with Vanguard',
        consequenceIfMissed: 'Vanguard\'s obligation to keep Advisor models confidential expires after 1 year',
        urgency: 'distant',
        sourceSection: 'Section 3.2',
        sourceQuote: 'protected for a duration not to exceed twelve (12) months from the date of disclosure',
        completed: false
      }
    ],
    financialCommitments: [
      {
        id: 'fin-nda-1',
        type: 'fee',
        amount: 'Fee-shifting for all legal expenses',
        schedule: 'Upon conclusion of any litigation',
        description: 'Non-prevailing party pays all attorney fees in Delaware Court of Chancery',
        sourceSection: 'Section 5.3',
        sourceQuote: 'prevailing party in any action shall be entitled to recover from the non-prevailing party all reasonable attorneys\' fees and expenses'
      }
    ],
    attentionItems: [
      {
        id: 'att-nda-1',
        category: 'unusual_term',
        priority: 'high',
        headline: 'Asymmetric Confidentiality Duration Disadvantage (5 Years vs 1 Year)',
        whyAttention: 'Mutual NDAs are standardly balanced with equal protection periods (typically 2 to 3 years for both parties). Here, the advisor is bound for 5 years while the company is released after only 12 months.',
        verbatimQuote: 'term of five (5) years following the date of disclosure... Any materials or advisory models disclosed by Advisor to Company shall be protected for a duration not to exceed twelve (12) months',
        sourceSection: 'Section 3.1 & 3.2',
        pageNumber: 1,
        suggestedQuestions: [
          'Can we harmonize both obligations to a mutual 2-year or 3-year term?',
          'Why does the company require 5 years while providing only 12 months protection for advisor IP?'
        ],
        status: 'discuss_with_counsel'
      },
      {
        id: 'att-nda-2',
        category: 'unilateral_right',
        priority: 'medium',
        headline: 'Carve-in of General Job Postings in Non-Solicitation Clause',
        whyAttention: 'Standard non-solicitation clauses usually exempt general, non-targeted public advertisements. Barring an advisor from hiring someone who responds to an open LinkedIn ad is unusually restrictive.',
        verbatimQuote: 'including responding to general un-targeted employment advertisements.',
        sourceSection: 'Section 4.1',
        pageNumber: 2,
        suggestedQuestions: [
          'Can we insert customary carve-out language for unprompted responses to general public job advertisements?',
          'Is this non-solicitation scope appropriate for an initial exploratory advisory discussion?'
        ],
        status: 'unreviewed'
      }
    ],
    inconsistencies: [
      {
        id: 'inc-nda-1',
        title: 'Nominal "Mutual" Agreement Title vs Asymmetric Terms',
        description: 'The preamble and recitals frame the agreement as a mutual exploration of purpose, yet Section 2.1 defines Confidential Information exclusively as information disclosed by Vanguard to Advisor, creating ambiguity regarding protections for Advisor materials.',
        conflictingSections: [
          {
            section: 'Section 2.1',
            quote: 'all proprietary, technical, operational, financial, and strategic information disclosed by Vanguard to Advisor.'
          },
          {
            section: 'Section 3.2',
            quote: 'Any materials or advisory models disclosed by Advisor to Company shall be protected'
          }
        ],
        notesForDiscussion: 'Ensure the definition in Section 2.1 explicitly mirrors both parties ("disclosed by either party to the other").'
      }
    ]
  }
];
