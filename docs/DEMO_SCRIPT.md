# Arka Solar IMS - End-to-End Golden Path Demo Script

> **The Golden Thread**: Serial number → Asset → Warranty clock → Service ticket → Job cost/profit.

This demo runs the complete journey of **Anita Sharma (3 kW On-Grid Residential Rooftop Solar System)** in Baner, Pune from initial public web enquiry to service ticket 18 months later in one uninterrupted run.

---

### Step 1: Public Web Enquiry & Duplicate Merge
- **URL**: [`/enquire`](http://localhost:3000/enquire)
- **Actor**: Public Customer (Anita Sharma)
- **Actions**:
  1. Fill in customer details:
     - Name: `Anita Sharma`
     - Phone: `9876543210` (Indian 10-digit mobile number)
     - Address: `Plot 14, Lotus Park, Baner, Pune`
     - System Size: `3 kW`
     - System Type: `On-Grid (Net Meter)`
     - Central Subsidy: Checked (`PM Surya Ghar Muft Bijli Yojana`)
  2. Click **Submit Solar Rooftop Enquiry**.
- **Expected Result**:
  - Lead `LD-2627-00001` is created.
  - Automatically assigned round-robin to sales executive (`Ravi Verma`).
  - Notification sent to sales.
- **Repeat / Duplicate Test**:
  - Re-submit the form with phone `9876543210`.
  - **Result**: Form merges with existing open lead, does **NOT** duplicate, and appends a `duplicate_enquiry` activity entry.

---

### Step 2: Sales Lead Queue & Pre-Qualification Checklist
- **URL**: [`/leads`](http://localhost:3000/leads) → Click on `LD-2627-00001` ([`/leads/d1111111-0000-0000-0000-000000000001`](http://localhost:3000/leads/d1111111-0000-0000-0000-000000000001))
- **Actor**: Sales Representative (`Ravi Verma`)
- **Actions**:
  1. Review Call Qualification Checklist (**REQ-LEAD-03**):
     - Shadow-free area: `350 sq ft`
     - Monthly consumption: `280 kWh / month`
     - Monthly bill: `₹3,500`
     - Grid suitability: Checked (Single phase, 4 kW sanctioned load)
     - Electricity Consumer #: `028740192831` (MSEDCL)
  2. Verify System-Size & Subsidy Estimator (**REQ-LEAD-04**):
     - Recommended size: `3.0 kW`
     - PM Surya Ghar Subsidy: `₹78,000`
  3. Click **Qualify & Schedule Survey** (**REQ-LEAD-09 & REQ-SURV-01**):
     - Assign Lead Technician: `Imran Khan`
     - Schedule Date: Tomorrow 10:00 AM - 12:00 PM
     - Click **Confirm & Dispatch**.
- **Expected Result**:
  - Lead status moves to `converted`.
  - Project `PRJ-2627-00001` created in `qualified` stage.
  - Survey job `JOB-2627-00001` created and synced to technician calendar.

---

### Step 3: Technician Roof Survey & Hard Gate Approval
- **URL**: [`/surveys`](http://localhost:3000/surveys) → Click on survey for `PRJ-2627-00001`
- **Actor**: Field Technician (`Imran Khan`) → Manager (`Rajesh Patel`)
- **Actions**:
  1. Inspect or submit rooftop technical measurements:
     - Roof Azimuth: `True South (Optimal)`
     - Roof Tilt: `20°`
     - Roof Type: `RCC Flat Terrace`
     - Shadow-free Area: `320 sq ft`
     - DC Cable Distance: `14m`
     - AC Cable Distance: `8m`
     - Recommended Capacity: `3.0 kW`
     - Feasibility: `Feasible`
  2. Notice the **Create Quote** button is **VISIBLY BLOCKED WITH A LOCK** (**REQ-SURV-04 Hard Gate G1**):
     - Tooltip: *"Survey Approval Gate: Quotes cannot be generated until physical site survey is approved by Operations Manager."*
  3. Switch to Operations Manager and click **Approve Survey (Unlock Quote)**.
- **Expected Result**:
  - Survey status transitions to `approved`.
  - Hard Gate G1 clears and unlocks the Quote Engine.

---

### Step 4: Quote Engine & PM Surya Ghar Subsidy Price Lock
- **URL**: [`/quotes/new?survey_id=...&project_id=...`](http://localhost:3000/quotes/new)
- **Actor**: Sales / Manager
- **Actions**:
  1. Select **3 kW Residential On-Grid (PM Surya Ghar Sweet Spot)** template.
  2. Live BOM calculation generates:
     - 6x 540W Mono PERC Solar Panels
     - 1x 3.3 kW Single Phase On-Grid Inverter
     - 14m Solar DC Cable (4 sq.mm)
     - 8m AC Armoured Cable
     - HDG Rooftop Mounting Structure Kit
  3. Financial Breakdown verified:
     - Base System Price: `₹1,62,285`
     - GST (13.8% Composite Solar Rate): `₹22,715`
     - Total Package Price: `₹1,85,000`
     - **PM Surya Ghar Subsidy**: `− ₹78,000` (Direct Benefit Transfer)
     - **Net Customer Investment**: `₹1,07,000`
  4. Cost / Margin Privacy Verification:
     - Logged in as sales: internal BOM cost and margin columns are completely hidden.
     - Logged in as manager/director: confidential gross margin (30.3%) is displayed.
  5. Click **Create & Freeze Quote**.
- **Expected Result**:
  - Quote `QT-2627-00001` created in `approved` status with prices frozen.
  - Click **Send to Customer** → Generates shareable public link [`/q/[token]`](http://localhost:3000/q/token).

---

### Step 5: Customer Acceptance & Order Creation
- **URL**: Open the public quote link [`/q/[token]`](http://localhost:3000/q/demo)
- **Actor**: Customer (`Anita Sharma`)
- **Actions**:
  1. Review proposal, 25-year panel performance guarantee, and ₹78,000 subsidy breakdown.
  2. Enter full legal name: `Anita Sharma`.
  3. Check agreement terms and click **Accept Proposal & Confirm Order**.
- **Expected Result (Automation A5)**:
  - Confetti celebration fires.
  - Quote marked `accepted`.
  - Order `ORD-2627-00001` created in `pending_payment` status with `unpaid` pay status.
  - 50% Advance Required: `₹92,500`.

---

### Step 6: 50% Advance Payment & Automation A6 Trigger
- **URL**: [`/orders`](http://localhost:3000/orders) → Click `ORD-2627-00001`
- **Actor**: Accounts (`Sneha Kulkarni`)
- **Actions**:
  1. Click **Record 50% Advance Payment**:
     - Amount: `₹92,500` (9250000 paise)
     - Method: `Bank Transfer (NEFT/RTGS)`
     - Reference / UTR: `HDFC9102834190`
     - Click **Record Payment Receipt**.
- **Expected Result (Automation A6)**:
  - Payment recorded with receipt `PAY-2627-00001`.
  - Order status automatically transitions from `pending_payment` to `confirmed`!
  - **Downstream Operations Auto-Triggered**:
    1. Inventory stock reserved for 6x panels, 1x inverter, and BOS hardware (`stock_allocations`).
    2. Warehouse pick-list generated without pricing.
    3. Installation job auto-scheduled for field crew on [`/schedule`](http://localhost:3000/schedule).

---

### Step 7: Warehouse Scanning & Rejection Gates
- **URL**: [`/warehouse`](http://localhost:3000/warehouse) → Click **Start QR Scan** for `DSP-2627-00001`
- **Actor**: Warehouse Executive (`Ganesh Shinde`)
- **Actions**:
  1. **Test Rejection Gates**:
     - Click **✗ Test Unknown Serial**: System rejects with `rejected_unknown` (*"Unknown serial number. Not found in stock catalogue"*).
     - Click **✓ Scan Valid Panel #1** (`SP-PAN-2026-0001`): Accepted and verified.
     - Click **✗ Test Duplicate Scan** (`SP-PAN-2026-0001`): System rejects with `rejected_duplicate` (*"Unit already dispatched/delivered previously"*).
  2. **Scan Required Hardware**:
     - Scan remaining 5x panels (`SP-PAN-2026-0002` to `0006`).
     - Scan Inverter (`SP-INV-2026-0001`).
     - Progress reaches 6/6 Panels and 1/1 Inverter.
  3. Click **Finalize Dispatch & Depart Truck**.
     - Dispatch moves to `in_transit`.
  4. Click **Confirm Delivery at Site (Start Warranties)** (**Automation A10**).
- **Expected Result (Automation A10)**:
  - Delivery confirmed.
  - Assets created in database linked to `Anita Sharma`.
  - **Warranty Clocks Start**:
    - Panels: **20 Years (240 Months)**
    - Inverter: **2 Years (24 Months)**

---

### Step 8: Field Installation, Live Power Test & Signature
- **URL**: [`/field`](http://localhost:3000/field) → Click **Open Installation & Power Test Form**
- **Actor**: Lead Technician (`Imran Khan`)
- **Actions**:
  1. Confirm as-built system: `3.0 kW`, `6 Panels`.
  2. Live Power Generation Test (**Hard Gate G14**):
     - String DC Voltage: `242 V`
     - Grid AC Voltage: `231 V`
     - Active Generation Output: `2.84 kW`
     - Earth Pit Resistance: `2.3 Ω` (< 5 Ω)
     - Certify checkbox: *"I certify power generation test PASSED & net-meter synchronised"*.
  3. Client Handover Signature (**REQ-INST-06**):
     - Sign customer name on touch screen / canvas pad.
     - Signatory Name: `Anita Sharma`.
  4. Click **Submit Install & Complete Handover**.
- **Expected Result (Automation A11)**:
  - Installation job completed.
  - Project stage transitions to `installed`.
  - Final GST Tax Invoice issued on [`/invoices`](http://localhost:3000/invoices).

---

### Step 9: Service Desk & Warranty Resolution (< 5s SLA)
- **URL**: [`/service`](http://localhost:3000/service)
- **Actor**: Customer Support Desk (`Deepak Joshi`)
- **Scenario A: Current Date / In-Warranty (< 5s Lookup)**:
  1. Enter serial `SP-INV-2026-0001` or phone `9876543210` in search box.
  2. Click **Lookup Warranty**.
  3. **Result in < 1 second**:
     - Customer: `Anita Sharma`
     - Asset: `SunPower 3.3 kW Single Phase Inverter`
     - Warranty Clock: `24 Months`
     - Status: 🟢 **IN-WARRANTY (100% FREE REPAIR & FREE PARTS PLEDGE)**
     - Billing: `₹0 (Free Warranty Service)`
  4. Click **Raise Ticket with this Verdict**:
     - Diagnostic fault code: `ERR_INV_GRID_FAIL` (Grid Undervoltage / AC Sync Loss)
     - Ticket `TKT-2627-00003` created with `billing: not_applicable`.

- **Scenario B: Acceptance Test Time-Travel 18 Months Later**:
  1. Click **18 Months Later (In-Warranty: 18m < 24m)** button.
  2. **Result**: Inverter is aged 18 months. Because 18 < 24 months, it is **STILL IN-WARRANTY (FREE SERVICE)**!

- **Scenario C: Acceptance Test Time-Travel 26 Months Later**:
  1. Click **26 Months Later (Out-of-Warranty: 26m > 24m Expired)** button.
  2. **Result**: Inverter is aged 26 months. Because 26 > 24 months, the verdict dynamically flips to:
     - 🔴 **OUT-OF-WARRANTY (AUTO-BILLED PARTS + LABOUR)**
     - Customer Billing: **₹1,500 Labour + Replacement Parts**!
  3. Click **Client Confirm & Close** on the ticket to verify the mandatory **REQ-SVC-04** closure sign-off gate!

---

### Step 10: Executive P&L Dashboard
- **URL**: [`/dashboard`](http://localhost:3000/dashboard)
- **Actor**: Director (`Priya Sharma`)
- **Verification**:
  1. Real 3D interactive rooftop model (`three.js`) with drag-to-orbit controls.
  2. Job Profitability table displaying:
     - Revenue: `₹1,85,000`
     - Material Cost: `₹1,24,000`
     - Labour: `₹12,500`
     - Gross Profit: `₹48,500` (Margin: `30.3%`)
  3. Toggle between **Today (IST)**, **This Week (IST)**, and **This Month (IST)**.
  4. Zero hard-coded fake figures; completeness flag cleanly indicates all financial links in the golden thread.
