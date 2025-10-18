# Quickstart: Promote Recurring Export

**Feature**: Promote Recurring Export
**Date**: 2025-10-17

## Overview
This feature adds recurring transaction export functionality directly to the home page, allowing users to export selected recurring transactions to an ICS calendar file immediately after loading data.

## Prerequisites
- Node.js 20+
- npm or yarn
- Modern web browser

## Setup
1. Ensure the application is running: `npm run dev`
2. Navigate to the home page

## Usage

### Export from CSV Upload
1. Click "Choose File" and select your Revolut CSV export
2. Wait for transactions to load and processing to complete
3. Click the "Export Recurring Transactions" button that appears
4. In the modal, review the list of detected recurring transactions
5. Uncheck any transactions you don't want to export
6. Click "Export" to download the ICS file
7. Import the downloaded `.ics` file into your calendar application

### Export from Demo Data
1. Click "Load Demo Data"
2. Wait for demo transactions to load
3. Click the "Export Recurring Transactions" button
4. Follow steps 4-7 above

## Expected Results
- ICS file downloads automatically
- File contains calendar events for each selected recurring transaction
- Events include proper recurrence rules (monthly, etc.)
- Compatible with Google Calendar, Apple Calendar, Outlook, etc.

## Troubleshooting
- **No export button appears**: Ensure data loaded successfully and contains recurring transactions
- **Export fails**: Check browser console for errors, ensure modern browser
- **ICS import fails**: Verify calendar app supports ICS with recurrence rules
- **Wrong transactions**: Review selection in modal before exporting

## Performance Notes
- Export typically completes in under 3 seconds
- Supports up to 10,000 transactions
- Processing happens entirely in the browser