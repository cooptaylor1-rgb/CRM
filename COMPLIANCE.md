# Compliance Policy - Wealth Management CRM

## Table of Contents
1. [Overview](#overview)
2. [SEC Regulations](#sec-regulations)
3. [State Regulations](#state-regulations)
4. [Required Audit Trails](#required-audit-trails)
5. [Data Retention Policies](#data-retention-policies)
6. [Exam Preparation Workflows](#exam-preparation-workflows)
7. [Regulatory Reporting](#regulatory-reporting)
8. [Client Communication Archiving](#client-communication-archiving)
9. [Fiduciary Duty Documentation](#fiduciary-duty-documentation)

## Overview

This document outlines the regulatory compliance requirements for the Wealth Management CRM system. As a system designed for SEC-registered investment advisers, compliance with federal and state regulations is paramount.

### Regulatory Framework

**Primary Regulations**:
- Investment Advisers Act of 1940
- SEC Rule 204-2 (Books and Records)
- SEC Rule 206(4)-7 (Compliance Programs)
- Regulation S-P (Privacy)
- FINRA Rules (if applicable to hybrid advisers)
- State Securities Laws (Blue Sky Laws)

### Compliance Objectives

1. **Recordkeeping**: Maintain required books and records
2. **Supervision**: Evidence of supervisory reviews
3. **Privacy**: Protect client information
4. **Best Interest**: Document fiduciary duty fulfillment
5. **Exam Readiness**: Ability to respond to regulatory examinations
6. **Disclosure**: Accurate and timely disclosures to clients

### Roles & Responsibilities

**Chief Compliance Officer (CCO)**:
- Overall compliance program oversight
- Annual compliance review
- Regulatory exam coordination
- Policy creation and updates
- Training program management

**Compliance Staff**:
- Day-to-day compliance monitoring
- Trade review and approval
- Account review
- Communication surveillance
- Reporting and recordkeeping

**Advisers**:
- Client documentation
- Adherence to compliance policies
- Timely completion of required reviews
- Accurate recordkeeping
- Client communication archiving

**Operations**:
- Accurate data entry
- Document management
- Transaction processing
- Client onboarding assistance

## SEC Regulations

### Investment Advisers Act of 1940

**Registration Requirements**:
- Form ADV Part 1: Regulatory filing
- Form ADV Part 2: Client disclosure brochure
- Annual amendments required
- Material changes filed promptly

**Fiduciary Standard**:
- Duty of care: Provide suitable investment advice
- Duty of loyalty: Act in client's best interest
- Full and fair disclosure of material facts
- Eliminate or disclose conflicts of interest

**Advertising Rules (Marketing Rule)**:
- Testimonials and endorsements disclosure
- Performance calculations standardized
- Hypothetical performance disclosures
- No false or misleading statements

### SEC Rule 204-2: Books and Records

#### Required Records

**1. Account Records** (6 years):
```
- Client agreements and contracts
- Investment advisory agreements
- Account opening documents
- Beneficiary information
- Authorized signers
- Powers of attorney
- Trust documents
```

**2. Transaction Records** (6 years):
```
- Trade confirmations
- Account statements
- Fee billing records
- Wire transfer authorizations
- Deposit/withdrawal records
- Transfer of asset forms
```

**3. Client Information** (6 years after termination):
```
- Client profile information
- Investment objectives
- Risk tolerance assessment
- Financial information
- Income and net worth
- Investment experience
- Employment information
```

**4. Portfolio Information** (6 years):
```
- Investment policy statements
- Model portfolio allocations
- Rebalancing records
- Asset allocation changes
- Security recommendations
- Performance reports
```

**5. Communications** (6 years):
```
- Client correspondence
- Marketing materials distributed
- Form ADV delivery records
- Disclosure documents
- Meeting notes (significant)
- Email archives
```

**6. Compliance Records** (6 years):
```
- Written compliance policies
- Compliance manual
- Annual compliance reviews
- Personal trading reports
- Outside business activities
- Political contributions
- Gifts and entertainment logs
```

**7. Financial Records** (6 years):
```
- Financial statements
- Trial balances
- General ledgers
- Invoices and billing records
- Fee calculations
- Expense allocations
```

**8. Form ADV** (5 years, 2 readily accessible):
```
- Current Form ADV Part 1 and 2
- All amendments
- State registrations
- Uniform Application for Investment Adviser Registration (if applicable)
```

#### Readily Accessible

**Definition**: Records that can be produced within 24 hours

**Implementation**:
- First 2 years: Active database storage
- Years 3-6: Archived but quickly retrievable
- Electronic format acceptable
- Indexed and searchable
- Backed up and redundant

### SEC Rule 206(4)-7: Compliance Program

#### Required Elements

**1. Written Policies and Procedures**:
```
- Code of ethics
- Personal securities transactions
- Insider trading prevention
- Custody of client assets
- Trade errors
- Best execution
- Allocation of trades
- Privacy protection
- Business continuity
- Valuation of securities
- Books and records retention
```

**2. Annual Review**:
- Review adequacy and effectiveness of policies
- Modifications based on:
  - Regulatory changes
  - Business changes
  - Identified weaknesses
- Document review in writing
- Present to principals/board

**3. Chief Compliance Officer**:
- Designated individual responsible
- Adequate authority and resources
- Reports to senior management
- Independent from portfolio management

**4. Testing and Monitoring**:
- Ongoing compliance monitoring
- Sample testing of controls
- Review of exceptions
- Remediation of deficiencies
- Documentation of all testing

### Regulation S-P: Privacy

**Privacy Notice Requirements**:
- Initial notice when relationship established
- Annual privacy notice
- Revised notice when practices change
- Opt-out notice (if sharing with non-affiliates)
- Explain information collected and shared

**Safeguards Rule**:
- Written information security program
- Designate information security coordinator
- Risk assessment
- Design and implement safeguards
- Oversee service providers
- Evaluate and adjust program

**System Implementation**:
```typescript
interface PrivacyNotice {
  version: string;
  effectiveDate: Date;
  sections: {
    informationCollected: string[];
    informationUsage: string[];
    informationSharing: {
      category: string;
      parties: string[];
      optOutAvailable: boolean;
    }[];
    securityMeasures: string;
    clientRights: string;
  };
}

// Track privacy notice delivery
interface PrivacyNoticeDelivery {
  householdId: string;
  noticeVersion: string;
  deliveryMethod: 'email' | 'mail' | 'electronic';
  deliveryDate: Date;
  acknowledgmentRequired: boolean;
  acknowledgmentDate?: Date;
}
```

## State Regulations

### State Registration

**When Required**:
- Office in state
- More than 5 clients in state (de minimis exemption)
- State-specific thresholds

**State Filings**:
- Form ADV through IARD
- Financial statements (if required)
- Notice filings
- Renewal fees (annual)

### State-Specific Requirements

**Notice of Withdrawal**:
- Notify clients when withdrawing from state
- Transfer records to successor adviser (if applicable)
- Retain records per state requirements

**Surety Bonds**:
- Required in some states
- Minimum amounts vary
- Alternative: Minimum net worth

**Custody Rules**:
- State variations on custody requirements
- Additional auditor examination (if custody)
- Quarterly account statements

### Blue Sky Laws

**Private Fund Exemptions**:
- Intrastate exemption
- Private placement exemption
- Accredited investor requirements

**Performance Advertising**:
- State-specific restrictions
- May be more stringent than federal
- Review state-by-state

## Required Audit Trails

### Audit Trail Principles

1. **Immutability**: Records cannot be altered after creation
2. **Completeness**: All relevant actions captured
3. **Timestamp**: Precise date and time with timezone
4. **Attribution**: Clear user identification
5. **Context**: Sufficient detail to understand action
6. **Accessibility**: Quick retrieval for examinations

### Entity-Specific Audit Requirements

#### Household Audit Trail

**Events to Log**:
```
- Household creation (with all initial data)
- Household updates (before/after values)
- Primary contact changes
- Adviser assignment changes
- Risk tolerance modifications
- Investment objective changes
- Review scheduling
- Status changes (active, inactive, closed)
- Member additions/removals
- Relationship changes
```

**Retention**: 6 years after household closure

**Example Audit Entry**:
```json
{
  "eventId": "evt_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userId": "usr_xyz789",
  "userEmail": "adviser@firm.com",
  "eventType": "household.update",
  "entityId": "hh_456def",
  "changes": {
    "before": {
      "riskTolerance": "moderate",
      "investmentObjective": "Growth and income"
    },
    "after": {
      "riskTolerance": "conservative",
      "investmentObjective": "Capital preservation"
    }
  },
  "reason": "Client requested lower risk after retirement",
  "ipAddress": "192.168.1.100",
  "sessionId": "sess_111222"
}
```

#### Account Audit Trail

**Events to Log**:
```
- Account opening (application, approval, activation)
- Account modifications (registration, strategy, restrictions)
- Fee schedule changes
- Billing method changes
- Management style changes (discretionary/non-discretionary)
- Account restrictions additions/modifications
- Account closure (reason, date, disposition)
- Ownership changes
- Beneficiary changes
```

**Retention**: 6 years after account closure

#### Transaction Audit Trail

**Events to Log**:
```
- Transaction creation (trade request)
- Trade approval/rejection (with rationale)
- Execution details
- Settlement information
- Corrections or cancellations (with reason)
- Fee calculations
- Corporate actions processing
- Manual adjustments (with justification)
```

**Retention**: 6 years from transaction date

**Critical Fields**:
```typescript
interface TransactionAudit {
  transactionId: string;
  accountId: string;
  requestedBy: string;           // Adviser who requested
  requestedAt: Date;
  approvedBy?: string;            // Compliance who approved
  approvedAt?: Date;
  rejectionReason?: string;
  executionPrice: number;
  executionTime: Date;
  confirmationNumber: string;
  settlementDate: Date;
  rationale: string;              // Investment rationale
  bestExecutionNote: string;      // Best execution documentation
}
```

#### Communication Audit Trail

**Events to Log**:
```
- Client meetings (date, attendees, topics, outcomes)
- Phone calls (date, duration, summary)
- Emails (archived with headers)
- Letters and notices sent
- Document deliveries (Form ADV, disclosures)
- Performance reports sent
- Billing statements sent
```

**Retention**: 6 years from communication date

#### Compliance Review Audit Trail

**Events to Log**:
```
- Review initiation
- Review assignment
- Review completion
- Findings documentation
- Exception approvals
- Follow-up actions
- Resolution documentation
```

**Retention**: 6 years from review date

**Review Types**:
```typescript
enum ReviewType {
  QUARTERLY_HOUSEHOLD = 'quarterly_household',
  ANNUAL_ACCOUNT = 'annual_account',
  PRE_TRADE = 'pre_trade',
  POST_TRADE = 'post_trade',
  NEW_ACCOUNT = 'new_account',
  ACCOUNT_CLOSURE = 'account_closure',
  MARKETING_MATERIAL = 'marketing_material',
  OUTSIDE_BUSINESS = 'outside_business',
  PERSONAL_TRADING = 'personal_trading',
  EXCEPTION = 'exception'
}
```

#### Document Audit Trail

**Events to Log**:
```
- Document upload (who, when, document type)
- Document access (who, when, reason)
- Document modification (versioning)
- Document deletion (who, when, reason)
- Document sharing (internal/external)
- Retention period assignment
- Destruction (after retention period)
```

**Retention**: 6 years or per document type requirements

### Access Audit Requirements

**PII Access Logging**:
```
- Field accessed
- User accessing
- Timestamp
- Business reason (if prompted)
- Full vs. masked view
- IP address
- Session ID
```

**Report Generation**:
```
- Report type
- Parameters (date ranges, filters)
- User generating
- Timestamp
- Recipient (if emailed)
```

**Bulk Operations**:
```
- Operation type (import, export, bulk update)
- Record count
- User performing
- Timestamp
- Success/failure count
- Error details
```

## Data Retention Policies

### Federal Requirements

| Record Type | Retention Period | Readily Accessible |
|------------|------------------|-------------------|
| Client agreements | 6 years after termination | First 2 years |
| Trade records | 6 years | First 2 years |
| Communications | 6 years | First 2 years |
| Account statements | 6 years | First 2 years |
| Performance reports | 6 years | First 2 years |
| Fee records | 6 years | First 2 years |
| Form ADV | 5 years | First 2 years |
| Compliance reviews | 6 years | First 2 years |
| Financial statements | 6 years | First 2 years |
| Correspondence | 6 years | First 2 years |

### State Requirements

**Variations**:
- Some states require 7 years
- Some require 5 years for certain records
- Follow most stringent requirement

**Implementation**:
- System default: 7 years (exceeds federal minimum)
- Indefinite retention for ADV and formation documents
- Automated deletion after retention period

### Retention Implementation

**Lifecycle Stages**:

**Stage 1: Active** (0-2 years)
- Full speed database access
- Indexed for searching
- Readily accessible
- Real-time queries

**Stage 2: Near-Line** (2-6 years)
- Archive database or S3
- Slower retrieval (acceptable for exams)
- Searchable index maintained
- Retrieved within hours

**Stage 3: Deep Archive** (6-7 years)
- Glacier or equivalent
- Retrieval in days
- Maintained for state requirements
- Searchable catalog

**Stage 4: Destruction** (After 7 years)
- Secure deletion process
- Certificate of destruction
- Audit log entry
- Exception: Legal holds, ongoing matters

**System Configuration**:
```typescript
interface RetentionPolicy {
  recordType: string;
  retentionYears: number;
  activeYears: number;          // Stage 1
  archiveYears: number;          // Stage 2
  deepArchiveYears: number;      // Stage 3
  legalHoldCheck: boolean;       // Check before destruction
  destructionMethod: 'secure_delete' | 'cryptographic_erasure';
}

const policies: RetentionPolicy[] = [
  {
    recordType: 'client_agreement',
    retentionYears: 6,
    activeYears: 2,
    archiveYears: 4,
    deepArchiveYears: 0,
    legalHoldCheck: true,
    destructionMethod: 'secure_delete'
  },
  {
    recordType: 'form_adv',
    retentionYears: -1,  // Indefinite
    activeYears: 2,
    archiveYears: -1,
    deepArchiveYears: 0,
    legalHoldCheck: true,
    destructionMethod: 'secure_delete'
  }
];
```

### Legal Hold Process

**When to Initiate**:
- Pending or threatened litigation
- Government investigation
- Regulatory examination
- Client complaint
- Internal investigation

**Hold Procedure**:
1. Legal/Compliance determines scope
2. IT notified to suspend deletion
3. Custodians notified (who has records)
4. Hold notice distributed
5. Periodic reminders
6. Hold lifted only by Legal/Compliance

**System Implementation**:
```typescript
interface LegalHold {
  holdId: string;
  matterName: string;
  initiatedBy: string;
  initiatedDate: Date;
  scope: {
    dateRange: { start: Date; end: Date };
    recordTypes: string[];
    keywords: string[];
    custodians: string[];
    clients?: string[];
    accounts?: string[];
  };
  status: 'active' | 'released';
  releasedDate?: Date;
  releasedBy?: string;
}

// Records under hold cannot be deleted
async function canDeleteRecord(recordId: string): Promise<boolean> {
  const activeHolds = await this.legalHoldRepo.findActive();
  for (const hold of activeHolds) {
    if (await this.recordMatchesHold(recordId, hold)) {
      return false;
    }
  }
  return true;
}
```

## Exam Preparation Workflows

### SEC Examination Process

**Typical Timeline**:
1. **Notification**: 2-4 weeks before exam starts
2. **Document Request**: Initial request list (IDL)
3. **On-site/Remote**: Examiners review records
4. **Interviews**: Staff interviews
5. **Deficiency Letter**: Preliminary findings
6. **Response**: Written response to deficiencies
7. **Closure**: Final outcome letter

### Initial Document Request (IDR)

**Common Requests**:
1. List of all clients
2. Form ADV (current and historical)
3. Compliance policies and procedures
4. Annual compliance review
5. Sample client agreements
6. Sample client communications
7. Performance reporting samples
8. Fee calculation examples
9. Trade allocation records
10. Personal trading records (staff)
11. Outside business activities
12. Marketing materials
13. Gifts and entertainment log
14. Conflicts of interest documentation
15. Vendor due diligence

**System Support**:
```typescript
interface ExamRequest {
  examId: string;
  examiner: string;
  requestDate: Date;
  dueDate: Date;
  requests: ExamRequestItem[];
  status: 'pending' | 'in_progress' | 'completed';
}

interface ExamRequestItem {
  itemNumber: string;
  description: string;
  dateRange?: { start: Date; end: Date };
  sampleSize?: number;
  status: 'pending' | 'collected' | 'reviewed' | 'submitted';
  assignedTo: string;
  documents: string[];           // Document IDs
  notes: string;
}

// Pre-built exam report generators
async function generateClientList(): Promise<ExamReport> {
  return {
    reportType: 'client_list',
    asOfDate: new Date(),
    data: await this.householdRepo.findActiveWithDetails(),
    format: 'excel'
  };
}

async function generateFeeCalculationSamples(sampleSize: number): Promise<ExamReport> {
  const accounts = await this.accountRepo.sampleRandom(sampleSize);
  const calculations = await Promise.all(
    accounts.map(a => this.billingService.getDetailedCalculation(a.id))
  );
  return {
    reportType: 'fee_calculations',
    sampleSize: sampleSize,
    data: calculations,
    format: 'pdf'
  };
}
```

### Exam Preparation Checklist

**Pre-Exam (Before Notification)**:
- [ ] Annual compliance review completed
- [ ] Policies and procedures up to date
- [ ] All required records current
- [ ] Sample testing documentation
- [ ] Personal trading reviewed
- [ ] Outside business activities current
- [ ] Marketing materials reviewed
- [ ] Form ADV amendments filed
- [ ] Mock exam conducted

**Upon Notification**:
- [ ] Assemble exam team
- [ ] Designate point person
- [ ] Review prior exam findings
- [ ] Conduct internal sweep
- [ ] Brief all staff
- [ ] Set up exam workspace (if on-site)
- [ ] Prepare initial document production
- [ ] Review potential risk areas

**During Exam**:
- [ ] Log all examiner requests
- [ ] Track document production
- [ ] Coordinate staff interviews
- [ ] Daily team debriefs
- [ ] Document informal findings
- [ ] Identify potential issues early
- [ ] Maintain professional demeanor
- [ ] Keep responses concise and factual

**Post-Exam**:
- [ ] Review deficiency letter
- [ ] Assess findings (factual accuracy)
- [ ] Draft response
- [ ] Implement remediation
- [ ] Update policies/procedures
- [ ] Additional training (if needed)
- [ ] Document lessons learned

### Exam Response Template

```markdown
# Response to SEC Examination Deficiency Letter

**Exam File Number**: [Number]  
**Date of Deficiency Letter**: [Date]  
**Response Date**: [Date]  
**Firm**: [Firm Name]

---

## Finding #1: [Description]

### Firm's Response:
[Acknowledge or dispute the finding with factual basis]

### Root Cause:
[Explanation of how the issue occurred]

### Corrective Actions Taken:
1. [Specific action with completion date]
2. [Specific action with completion date]
3. [Specific action with completion date]

### Preventive Measures:
[Description of policy/procedure changes to prevent recurrence]

### Supporting Documentation:
- [Exhibit A: Updated policy]
- [Exhibit B: Training materials]
- [Exhibit C: Testing results]

---

## Finding #2: [Description]
[Repeat structure for each finding]
```

## Regulatory Reporting

### Form ADV Amendments

**Annual Amendment**:
- Due date: 90 days after fiscal year end
- Update all information
- Material changes highlighted
- File via IARD system

**Other-Than-Annual Amendment**:
- Required for material changes
- File promptly (within 30 days)
- Examples:
  - Change in control
  - Material disciplinary events
  - Change in custody status
  - New business lines
  - Change in fee schedule

**Brochure Delivery**:
- Initial: Before or at time of entering advisory contract
- Annual: Within 120 days of fiscal year end
- Material changes: Promptly

**System Tracking**:
```typescript
interface ADVAmendment {
  amendmentId: string;
  filingType: 'annual' | 'other_than_annual';
  fiscalYearEnd?: Date;
  filingDate: Date;
  effectiveDate: Date;
  iardConfirmation: string;
  materialChanges: string[];
  brochureUpdated: boolean;
  brochureDelivered: boolean;
  preparedBy: string;
  reviewedBy: string;      // Compliance
  approvedBy: string;       // Principal
}
```

### Form ADV-E (if custody)

**When Required**:
- Adviser has custody of client assets
- Annual surprise examination by independent accountant

**Filing**:
- Within 120 days of completion of exam
- Filed via IARD

**Exemptions**:
- Qualified custodian holds assets
- Advisory fees debited per written authorization

### Form PF (if required)

**Who Files**:
- Advisers to private funds
- $150M+ in private fund AUM

**Deadlines**:
- Large advisers: Quarterly
- Other advisers: Annual

**Content**:
- Fund information
- AUM
- Exposures
- Counterparties
- Valuation methods

### State Reporting

**Renewal Filings**:
- Annual renewal via IARD
- Renewal fees
- Updated financial statements (if required)

**Financial Statement Requirements**:
- Required if:
  - Custody of client funds
  - Require prepayment of fees ($1,200+ and 6+ months)
  - Negative net worth
- Audited or unaudited (depends on state)
- Filed annually

## Client Communication Archiving

### Email Archiving

**Scope**:
- All email sent/received by firm email addresses
- Advisory-related personal email (if used)
- Attachments

**System Requirements**:
- Tamper-proof archiving
- Indexed and searchable
- Full-text search capability
- Boolean search operators
- Export capability
- 6-year retention minimum

**Implementation Options**:
1. Third-party archive service (Smarsh, Global Relay)
2. Microsoft 365 archiving with compliance add-on
3. On-premise archive solution

**Search Capabilities**:
```typescript
interface EmailSearchParams {
  dateRange: { start: Date; end: Date };
  participants?: string[];      // To, From, CC, BCC
  keywords?: string[];
  subjects?: string[];
  hasAttachment?: boolean;
  attachmentTypes?: string[];
  clientId?: string;            // Tag emails to clients
  accountId?: string;
}

// Example searches for exam
- "All emails with client Smith in 2023"
- "Emails discussing performance in Q4 2023"
- "Emails with attachments containing 'proposal'"
```

### Meeting Notes

**What to Document**:
- Date and time
- Attendees
- Location (or platform if virtual)
- Purpose of meeting
- Topics discussed
- Decisions made
- Action items
- Follow-up required

**Level of Detail**:
- Not a transcript
- Key points and outcomes
- Investment discussions in more detail
- Client instructions documented
- Any concerns or complaints noted

**Template**:
```markdown
# Client Meeting Notes

**Date**: [Date]  
**Time**: [Time]  
**Location**: [Office/Zoom/Phone]  
**Attendees**:
- Client: [Names]
- Firm: [Adviser names]

**Purpose**: [Quarterly review / Portfolio discussion / etc.]

**Topics Discussed**:
1. [Topic 1]
   - [Key points]
   - [Client questions/comments]
   - [Adviser response]

2. [Topic 2]
   ...

**Decisions Made**:
- [Decision 1 with rationale]
- [Decision 2 with rationale]

**Action Items**:
- [ ] [Action] - Assigned to: [Person] - Due: [Date]
- [ ] [Action] - Assigned to: [Person] - Due: [Date]

**Next Meeting**: [Date and purpose]

**Notes prepared by**: [Adviser name]  
**Date prepared**: [Date]
```

**System Storage**:
```typescript
interface MeetingNote {
  meetingId: string;
  meetingType: 'quarterly_review' | 'annual_review' | 'onboarding' | 'ad_hoc';
  householdId: string;
  participants: {
    clients: string[];           // Person IDs
    advisers: string[];          // User IDs
  };
  meetingDate: Date;
  location: string;
  summary: string;
  topicsDiscussed: string[];
  decisionsMade: Decision[];
  actionItems: ActionItem[];
  nextMeetingDate?: Date;
  preparedBy: string;
  preparedDate: Date;
  documentsReferenced: string[];  // Document IDs
  tags: string[];
}
```

### Phone Call Logs

**What to Log**:
- Date and time
- Duration
- Participants
- Reason for call
- Summary of discussion
- Any instructions or decisions

**When to Log**:
- Material discussions (investments, fees, changes)
- Client instructions
- Complaint or concern
- Regulatory or compliance matter

**System Entry**:
```typescript
interface PhoneCallLog {
  callId: string;
  householdId: string;
  personId?: string;
  callDate: Date;
  duration: number;              // Minutes
  initiator: 'client' | 'firm';
  participants: string[];
  purpose: string;
  summary: string;
  material: boolean;             // Required longer retention
  followUpRequired: boolean;
  loggedBy: string;
  loggedAt: Date;
}
```

### Text Messages / Instant Messages

**Policy**:
- Business communications via approved channels only
- Personal device use discouraged
- If used, must be archived

**Approved Channels**:
- Firm email
- CRM messaging (if archiving enabled)
- Approved collaboration tools with archiving

**Prohibited Channels** (unless archiving solution):
- Personal email
- SMS/text messages
- WhatsApp, Signal, etc.
- Unarchived Slack/Teams

## Fiduciary Duty Documentation

### Best Interest Standard

**Requirements**:
- Consider client's investment profile
- Reasonable belief advice is in best interest
- No conflicts of interest, or:
  - Eliminate conflict, or
  - Full disclosure

**Documentation Needed**:
- Investment policy statement
- Risk assessment
- Suitability analysis
- Alternatives considered
- Rationale for recommendation

### Investment Policy Statement (IPS)

**Required Sections**:

**1. Client Profile**:
```
- Investment objectives
- Return requirements
- Risk tolerance
- Time horizon
- Liquidity needs
- Tax considerations
- Legal/regulatory constraints
- Unique circumstances
```

**2. Portfolio Strategy**:
```
- Asset allocation targets
- Allowable investments
- Prohibited investments
- Rebalancing policy
- Performance benchmarks
```

**3. Roles and Responsibilities**:
```
- Client responsibilities
- Adviser responsibilities
- Custodian role
- Third-party managers (if any)
```

**4. Monitoring and Review**:
```
- Performance reporting frequency
- Review meeting schedule
- Rebalancing triggers
- IPS review frequency
```

**System Template**:
```typescript
interface InvestmentPolicyStatement {
  ipsId: string;
  householdId: string;
  effectiveDate: Date;
  nextReviewDate: Date;
  
  clientProfile: {
    objectives: string[];
    returnRequirement: number;      // Target annual return
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: number;            // Years
    liquidityNeeds: string;
    taxConsiderations: string;
    constraints: string;
  };
  
  strategy: {
    assetAllocation: {
      asset: string;
      target: number;
      min: number;
      max: number;
    }[];
    allowedInvestments: string[];
    prohibitedInvestments: string[];
    rebalancingThreshold: number;   // Percentage drift
    benchmarks: string[];
  };
  
  governance: {
    clientResponsibilities: string[];
    adviserResponsibilities: string[];
    reviewFrequency: 'quarterly' | 'semi_annual' | 'annual';
  };
  
  approvals: {
    clientSignature: string;
    clientSignatureDate: Date;
    adviserSignature: string;
    adviserSignatureDate: Date;
  };
}
```

### Suitability Documentation

**For Each Recommendation**:
- Client's current situation
- Investment characteristics
- Why suitable for this client
- Risks disclosed
- Alternatives considered
- Client understanding confirmed

**Trade Rationale Template**:
```markdown
# Investment Recommendation

**Client**: [Name]  
**Account**: [Account number]  
**Date**: [Date]  
**Adviser**: [Name]

## Recommendation
[Buy/Sell] [Quantity] shares of [Security]

## Client Profile
- **Objective**: [Growth/Income/Preservation]
- **Risk Tolerance**: [Conservative/Moderate/Aggressive]
- **Time Horizon**: [Years]
- **Current Allocation**: [Summary]

## Investment Analysis
- **Security**: [Name and description]
- **Sector/Asset Class**: [Classification]
- **Risk Level**: [Low/Medium/High]
- **Expected Return**: [If applicable]
- **Yield**: [If applicable]

## Suitability Rationale
[Explain why this investment is suitable for this particular client, 
considering their profile, current portfolio, and investment policy]

## Risks Disclosed
- [Risk 1]
- [Risk 2]
- [Risk 3]

## Alternatives Considered
- [Alternative 1 and why not selected]
- [Alternative 2 and why not selected]

## Client Discussion
[Summary of discussion with client, questions asked, understanding confirmed]

## Conclusion
[Reaffirm suitability and best interest standard]

**Prepared by**: [Adviser]  
**Date**: [Date]
```

### Performance Reporting

**Required Elements**:
- Time-weighted returns (recommended)
- Benchmark comparison
- Appropriate benchmark selection
- Disclosure of calculation method
- Net of fees (or gross with fees disclosed)
- Time period covered

**Disclosure Requirements**:
```
- Past performance not guarantee of future results
- Returns include reinvestment of dividends
- Returns net/gross of advisory fees
- Benchmark description and limitations
- Calculation methodology
- Any performance-based fees (if applicable)
```

**Frequency**:
- Quarterly minimum for managed accounts
- More frequent if requested by client
- Available on demand via portal

### Fee Disclosures

**Form ADV Part 2 Brochure**:
- Fee schedule clearly stated
- Billing method (advance/arrears)
- Fee negotiability
- Other fees client may pay (custody, fund expenses)
- Compensation from third parties (if any)

**Billing Statements**:
- Clear calculation shown
- Time period
- Account value used
- Fee rate applied
- Itemization of any additional fees

**Annual Fee Disclosure**:
- Total fees paid (dollar amount and percentage)
- Comparison to prior year
- Explanation of any changes

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Owner**: Chief Compliance Officer  
**Review Frequency**: Annual  
**Classification**: Internal Use Only
