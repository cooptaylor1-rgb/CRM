# Workflows - Wealth Management CRM

## Table of Contents
1. [Client Onboarding](#client-onboarding)
2. [Investment Proposal and Approval](#investment-proposal-and-approval)
3. [Quarterly Review Cycle](#quarterly-review-cycle)
4. [Account Opening Process](#account-opening-process)
5. [KYC/AML Verification](#kycaml-verification)
6. [Compliance Review Workflows](#compliance-review-workflows)
7. [Document Management Lifecycle](#document-management-lifecycle)
8. [Rebalancing and Trade Execution](#rebalancing-and-trade-execution)

## Client Onboarding

### Overview
Complete workflow from prospect to active client with accounts ready for funding.

### Steps

#### 1. Initial Contact (Status: Prospect)

**Participants**: Adviser, Prospect

**Actions**:
1. Create household record
   - Enter household name
   - Assign to adviser
   - Set status: "prospect"
2. Add primary contact person
   - Basic information (name, email, phone)
   - No SSN required at this stage
3. Schedule discovery meeting
4. Log communication

**System Requirements**:
- Household creation permission
- Audit log entry created
- Communication logged

#### 2. Discovery Meeting

**Participants**: Adviser, Client

**Actions**:
1. Collect client information
   - Financial situation
   - Investment experience
   - Goals and objectives
   - Risk tolerance
2. Document meeting notes
3. Provide Form ADV Part 2
4. Explain services and fees

**Deliverables**:
- Completed risk tolerance questionnaire
- Investment objectives documented
- Form ADV delivered (logged)
- Meeting notes saved

#### 3. Client Information Gathering

**Participants**: Adviser, Operations, Client

**Actions**:
1. Complete person records
   - Full legal names
   - Date of birth
   - SSN (encrypted)
   - Contact information
   - Employment information
   - Financial information (income, net worth)
2. Add additional household members
3. Create entity records (if applicable)
   - Trust documents
   - Corporate documents
   - EIN information
4. Collect identification documents
   - Driver's license
   - Passport
   - Proof of address

**System Requirements**:
- PII encryption enabled
- Document upload with proper tagging
- Retention policies applied

#### 4. KYC/AML Verification

**Participants**: Compliance, Operations

**Actions**:
1. Verify identity
   - Government-issued ID
   - Address verification
2. Screen against OFAC lists
3. PEP check
4. Accredited investor verification (if applicable)
5. Document verification results
6. Update KYC status to "verified"

**System Updates**:
- `kyc_status` = 'verified'
- `kyc_verified_date` = current date
- `kyc_verified_by` = compliance user
- Audit log entry

#### 5. Investment Policy Statement

**Participants**: Adviser, Client

**Actions**:
1. Draft IPS based on:
   - Risk tolerance
   - Time horizon
   - Goals and objectives
   - Liquidity needs
   - Tax considerations
2. Review with client
3. Client approval
4. Document signatures

**Deliverables**:
- Signed IPS document
- Uploaded to document management
- Linked to household

#### 6. Account Opening

**Participants**: Operations, Adviser, Client

**Actions**:
1. Prepare account applications
   - Account type selection
   - Registration determination
   - Beneficiary designation
2. Generate account agreements
3. Client signatures
4. Submit to custodian
5. Receive account numbers
6. Create account records in CRM

**System Requirements**:
- Account number unique
- Owner (person or entity) verified
- Fee schedule assigned
- Investment strategy assigned
- Account status: "pending"

#### 7. Account Funding

**Participants**: Client, Operations

**Actions**:
1. Provide funding instructions to client
2. Receive funds (check, wire, transfer)
3. Confirm receipt with custodian
4. Update account status to "active"
5. Household status to "active"

**System Updates**:
- Account status: "pending" → "active"
- Household status: "prospect" → "active"
- `onboarding_date` = today
- Audit log entries

#### 8. Initial Investment

**Participants**: Adviser, Compliance

**Actions**:
1. Create trade requests
2. Compliance pre-trade review
3. Execute trades
4. Confirm executions
5. Settlement

**System Requirements**:
- Transaction records created
- Compliance approval logged
- Positions updated upon settlement

#### 9. Welcome and Follow-up

**Participants**: Adviser, Client

**Actions**:
1. Send welcome letter
2. Provide login credentials (if portal)
3. Schedule first review meeting
4. Log all communications

**Deliverables**:
- Welcome packet sent and logged
- First review meeting scheduled
- `next_review_date` set (typically 90 days)

### Timeline

| Stage | Typical Duration | Dependencies |
|-------|------------------|--------------|
| Initial Contact | Day 1 | None |
| Discovery Meeting | Days 1-7 | Scheduling |
| Information Gathering | Days 7-14 | Client responsiveness |
| KYC/AML | Days 14-21 | Document receipt |
| IPS Creation | Days 21-28 | Client approval |
| Account Opening | Days 28-35 | Custodian processing |
| Funding | Days 35-42 | Client action |
| Initial Investment | Days 42-49 | Funding complete |
| **Total** | **6-8 weeks** | |

### Compliance Requirements

- [ ] Form ADV delivered and logged
- [ ] KYC verification completed
- [ ] AML screening performed
- [ ] Accredited investor verified (if applicable)
- [ ] IPS signed by client
- [ ] Account agreements signed
- [ ] Suitability documented
- [ ] All communications logged

## Investment Proposal and Approval

### Overview
Process for proposing and executing investment changes requiring client or compliance approval.

### Material Change Proposal

#### 1. Proposal Creation

**Trigger**: Adviser identifies investment opportunity or need for portfolio change

**Actions**:
1. Document investment rationale
2. Perform suitability analysis
3. Calculate impact on portfolio
4. Prepare proposal document

**Required Information**:
- Current allocation
- Proposed allocation
- Securities to buy/sell
- Rationale for changes
- Risk assessment
- Expected impact
- Alternatives considered

#### 2. Client Presentation (Non-Discretionary)

**Participants**: Adviser, Client

**Actions**:
1. Present proposal to client
2. Explain rationale and risks
3. Answer questions
4. Document discussion
5. Obtain client approval

**Deliverables**:
- Meeting notes
- Client approval documentation
- Signed authorization (if written required)

#### 3. Compliance Review

**Participants**: Compliance Officer

**Actions**:
1. Review proposal for:
   - Suitability
   - IPS compliance
   - Restrictions compliance
   - Concentration risk
   - Conflicts of interest
2. Approve or request changes
3. Document review

**System Requirements**:
- Compliance review record created
- Approval/rejection logged
- If rejected, rationale documented

#### 4. Execution

**Participants**: Adviser, Trading

**Actions**:
1. Create transaction requests
2. Execute trades
3. Confirm executions
4. Monitor settlement
5. Update positions

**System Updates**:
- Transactions created with status "pending"
- Upon execution: status → "executed"
- Upon settlement: status → "settled"
- Positions updated
- Account values recalculated

#### 5. Client Notification

**Participants**: Adviser, Client

**Actions**:
1. Send trade confirmations
2. Update client if material change
3. Log communication

## Quarterly Review Cycle

### Overview
Systematic review of all active households each quarter for performance, suitability, and compliance.

### Timeline
- Q1: January-March reviews
- Q2: April-June reviews
- Q3: July-September reviews
- Q4: October-December reviews

### Process

#### 1. Review Preparation (Operations)

**Timing**: 2 weeks before quarter end

**Actions**:
1. Generate review schedule
2. Assign reviews to advisers
3. Prepare performance reports
4. Identify households needing attention:
   - Significant losses
   - Significant gains
   - Drift from allocation
   - Missing information
   - Upcoming IPS review dates

#### 2. Adviser Review

**Timing**: During review quarter

**Actions**:
1. Review performance vs. benchmark
2. Review allocation vs. IPS
3. Assess suitability
4. Check for necessary updates:
   - Changed circumstances
   - Goals still appropriate
   - Risk tolerance still appropriate
5. Identify action items:
   - Rebalancing needed
   - IPS update needed
   - Additional funding opportunity
6. Document review in system

**System Requirements**:
- Compliance review record created
- Review type: "quarterly_household"
- Findings documented
- Action items recorded
- Review status: "completed"

#### 3. Client Meeting

**Timing**: Within review quarter

**Actions**:
1. Schedule meeting with client
2. Present performance report
3. Discuss any changes in circumstances
4. Review goals and objectives
5. Present recommendations
6. Obtain approval for changes
7. Schedule next review

**Deliverables**:
- Performance report provided
- Meeting notes documented
- Client approval for any changes
- Next review scheduled

#### 4. Compliance Oversight

**Timing**: End of quarter

**Actions**:
1. Review sample of quarterly reviews
2. Verify all households reviewed
3. Follow up on missing reviews
4. Escalate issues

**System Reports**:
- Reviews completed vs. required
- Outstanding action items
- Households missing reviews
- Findings summary

#### 5. Follow-up Actions

**Actions**:
1. Execute approved changes
2. Update IPS if needed
3. Complete action items
4. Update `last_review_date`
5. Set `next_review_date`

## Account Opening Process

### Overview
Detailed account opening workflow from application to activation.

### Steps

#### 1. Account Application

**Initiator**: Adviser or Operations

**Actions**:
1. Create account record
   - Account type
   - Owner (person or entity)
   - Household association
   - Registration
2. Status: "pending"

**Validations**:
- Owner KYC status must be "verified"
- Account number unique
- Registration matches ownership

#### 2. Document Preparation

**Responsible**: Operations

**Actions**:
1. Generate account agreement
2. Generate required disclosures
3. Generate beneficiary forms (if applicable)
4. Generate options agreement (if needed)
5. Prepare for signature

**Documents Required**:
- Investment advisory agreement
- Account application
- IPS
- Form ADV Part 2
- Privacy notice
- Disclosures (conflicts, risks, etc.)

#### 3. Client Signature

**Responsible**: Adviser, Client

**Actions**:
1. Review documents with client
2. Explain terms and conditions
3. Obtain signatures
4. Upload signed documents
5. Link documents to account

**System Requirements**:
- Documents tagged to account
- Signature dates recorded
- Delivery logged

#### 4. Compliance Review

**Responsible**: Compliance

**Actions**:
1. Review account opening package
2. Verify:
   - KYC complete
   - Appropriate account type
   - Proper registration
   - Suitability
   - All documents present and signed
3. Approve or request corrections

**System Update**:
- Compliance review created
- Review type: "new_account"
- Approval/rejection logged

#### 5. Custodian Submission

**Responsible**: Operations

**Actions**:
1. Complete custodian application
2. Submit to custodian
3. Track submission
4. Receive account number from custodian
5. Update CRM with custodian account number

#### 6. Account Activation

**Responsible**: Operations

**Actions**:
1. Verify account open at custodian
2. Update account status to "active"
3. Assign fee schedule
4. Assign investment strategy
5. Set up billing

**System Updates**:
- Account status: "pending" → "active"
- `inception_date` = today
- Audit log entry

#### 7. Initial Funding

**Responsible**: Client, Operations

**Actions**:
1. Provide funding instructions
2. Receive funds
3. Confirm with custodian
4. Update account value

## KYC/AML Verification

### Overview
Know Your Customer and Anti-Money Laundering verification process.

### Person KYC

#### 1. Identity Verification

**Required Documents**:
- Government-issued photo ID (driver's license, passport)
- Social Security card or tax document
- Proof of address (utility bill, bank statement <90 days)

**Actions**:
1. Review documents for authenticity
2. Verify information matches application
3. Check expiration dates
4. Make copies and upload

**Red Flags**:
- Expired documents
- Poor quality copies
- Information doesn't match
- Suspicious alterations

#### 2. OFAC Screening

**Actions**:
1. Screen against OFAC SDN list
2. Screen against other sanctions lists
3. Document results
4. If match, escalate immediately

**System Integration**:
- Automated screening service
- Results stored in person record
- Alerts generated for matches

#### 3. PEP Check

**Actions**:
1. Check if politically exposed person
2. If yes, apply enhanced due diligence
3. Document findings

**Enhanced Due Diligence** (if PEP):
- Source of wealth verification
- Additional reference checks
- Senior management approval

#### 4. Accredited Investor Verification

**Required if**:
- Investing in private funds
- Certain alternative investments

**Verification Methods**:
- Income verification (tax returns, W-2)
- Net worth verification (bank statements, appraisals)
- Professional certification (CPA, attorney letter)

**Actions**:
1. Collect verification documents
2. Review and verify
3. Document determination
4. Update person record

#### 5. KYC Approval

**Actions**:
1. Compliance officer reviews all checks
2. Approves or rejects
3. Updates KYC status

**System Updates**:
- `kyc_status` = 'verified'
- `kyc_verified_date` = current date
- `kyc_verified_by` = user ID
- Audit log entry

### Entity KYC

#### 1. Entity Documentation

**Required Documents**:
- Certificate of formation
- Trust agreement or corporate bylaws
- EIN documentation
- Operating agreement (LLC)
- Beneficial ownership form (FinCEN)

**Actions**:
1. Review entity documents
2. Verify entity exists
3. Identify beneficial owners (25%+ ownership)
4. Verify authorized signers

#### 2. Beneficial Owner Verification

**FinCEN Requirements**:
- Identify individuals with 25%+ ownership
- Identify one control person
- Verify identity of each beneficial owner

**Actions**:
1. Identify beneficial owners from documents
2. Verify each beneficial owner (same as person KYC)
3. Document ownership structure

#### 3. Entity OFAC Screening

**Actions**:
1. Screen entity name
2. Screen all beneficial owners
3. Screen authorized signers
4. Document results

## Compliance Review Workflows

### Pre-Trade Review

**When Required**: Discretionary accounts, certain securities

**Process**:
1. Adviser creates trade request
2. System routes to compliance queue
3. Compliance reviews for:
   - Suitability
   - IPS compliance
   - Restrictions
   - Best execution
4. Compliance approves or rejects
5. If approved, trade executes

**System Requirements**:
- Trade review record created
- Approval/rejection logged with rationale
- Trade cannot execute without approval

### Post-Trade Review

**Frequency**: Daily or weekly sampling

**Process**:
1. System generates sample of executed trades
2. Compliance reviews for:
   - Proper authorization
   - Fair allocation (if block trades)
   - Best execution
   - Proper documentation
3. Document findings
4. Escalate issues

### Exception Approval

**When Required**: Trades outside normal parameters

**Examples**:
- Concentration limits exceeded
- Non-standard securities
- Margin trading
- Options strategies

**Process**:
1. Adviser requests exception
2. Provides rationale
3. Compliance reviews
4. Senior management approval if material
5. Document approval
6. Time-limited or permanent

**System Requirements**:
- Exception request documented
- Approval chain logged
- Exception expiration tracked

## Document Management Lifecycle

### Document Upload

**Process**:
1. User uploads document
2. System assigns:
   - Unique document ID
   - Upload timestamp
   - Uploader user ID
   - Checksum (integrity)
3. User assigns metadata:
   - Document type
   - Related entity (household, account, person)
   - Retention period
   - Tags
4. Document encrypted and stored

**Validation**:
- File type allowed (PDF, DOCX, XLSX, JPG, PNG)
- File size within limits (50MB)
- Virus scan passed

### Document Access

**Process**:
1. User requests document
2. System checks permissions
3. If authorized:
   - Generate pre-signed download URL
   - Log access in audit trail
   - Serve document
4. If unauthorized:
   - Deny access
   - Log attempted access

**Audit Requirements**:
- All access logged
- User, timestamp, document recorded
- Reason for access (if prompted)

### Document Retention

**Automatic Retention**:
- System calculates `retention_end_date` based on:
  - Document type retention rules
  - Related entity (account close date, etc.)
  - Regulatory requirements
- Legal hold check before deletion
- Secure deletion after retention period

**Retention Periods**:
- Client agreements: 6 years after termination
- Form ADV: 5 years
- Correspondence: 6 years
- Trade confirmations: 6 years
- Tax documents: 7 years

### Document Archival

**Process**:
1. Documents older than 2 years moved to archive storage
2. Index maintained for search
3. Retrieval slower but cost-effective
4. After retention period, secure deletion

## Rebalancing and Trade Execution

### Rebalancing Trigger

**Triggers**:
- Scheduled (quarterly, annual)
- Drift from target allocation (>5%)
- Client deposits/withdrawals
- IPS change
- Market conditions

**Process**:
1. System identifies accounts needing rebalancing
2. Calculates trades needed to return to target
3. Generates rebalancing proposal
4. Adviser reviews and adjusts
5. Submit for approval

### Trade Execution Workflow

#### 1. Trade Request Creation

**Initiator**: Adviser

**Actions**:
1. Create transaction records
2. Specify:
   - Account
   - Security
   - Action (buy/sell)
   - Quantity or dollar amount
   - Order type (market, limit)
   - Rationale
3. Submit for approval

**System Validations**:
- Account status must be "active"
- Sufficient cash for buys
- Sufficient shares for sells
- No restrictions on security

#### 2. Pre-Trade Compliance Review

**Reviewer**: Compliance Officer

**Checks**:
- Suitability for client
- IPS compliance
- Concentration limits
- Restricted securities list
- Conflict of interest

**Actions**:
- Approve: Trade proceeds
- Reject: Return to adviser with reason
- Request info: Ask adviser for clarification

#### 3. Trade Execution

**Executor**: Trading desk or Adviser

**Actions**:
1. Submit order to custodian
2. Monitor execution
3. Record execution details:
   - Execution price
   - Execution time
   - Confirmation number
4. Update transaction record

**System Updates**:
- Transaction status: "pending" → "executed"
- Execution details recorded
- Awaiting settlement

#### 4. Settlement

**Timing**: T+1 for stocks, varies by security type

**Actions**:
1. Monitor settlement
2. Upon settlement:
   - Update transaction status to "settled"
   - Update account positions
   - Recalculate account value
   - Update cost basis

**System Updates**:
- Transaction status: "executed" → "settled"
- Positions updated (create or update position record)
- Account values recalculated
- Audit log entries

#### 5. Post-Trade Review

**Reviewer**: Compliance

**Actions**:
1. Review execution quality
2. Verify best execution
3. Check trade allocation (if block)
4. Document review

#### 6. Client Communication

**Actions**:
1. Generate trade confirmation
2. Send to client (email or mail)
3. Log communication
4. Answer client questions

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Owner**: Operations & Compliance Team  
**Classification**: Internal Use Only
