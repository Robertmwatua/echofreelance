# Course fees and MegaPay instalments

Agreed policy: collect KES through the school's active **General** MegaPay linked account. New student quotes require **50% of discounted tuition** to unlock access by default. Admins can change the access-deposit percentage and offer discounts. Existing quotes retain their previously agreed total and unlock threshold. Students may pay the remaining balance later. See [School operations](school-operations.md) for the current fee controls and brochure import. This does not enforce a later payment deadline, revoke access for outstanding balances, or prevent certificates for students with a balance.

## Connect the live account

1. Deploy the migration `20261115160000_course_instalments` and the API/frontend changes together. The migration creates fee statements and payment records; it does not invent fees or rewrite enrolments. Existing courses start with `feeConfirmed=false` because legacy prices were not confirmed KES school fees.
2. In the **API host's** secret/environment settings (currently the Render `echofreelance-api` service), add `MEGAPAY_API_KEY` from Linked Accounts → **General**, and `MEGAPAY_EMAIL` matching the MegaPay login. Save/redeploy the API. Do not use the Jengastack key, commit credentials, or put these in Vercel/`NEXT_PUBLIC_*` variables.
3. In the General account's MegaPay webhook settings, set the HTTPS backend callback: `https://echofreelance-api.onrender.com/api/payments/megapay/webhook`. If the API hostname changes, update this URL. Do not replace a webhook used by another application without routing notifications for both.
4. Sign in as Admin → **School fees & payments** (`/admin/payments`), choose a course, enter its total fee in whole KES and confirm. `0` explicitly confirms a free course. Fees can also be set below the course editor. Tutors manage content, but only Admins confirm fees.
5. Publish the course with actual lessons and reviewed intake information. A roadmap preview alone cannot accept payment.
6. Before announcing payments, have the owner perform one controlled live instalment from their own phone. Check the STK amount, the General account's destination, the MegaPay transaction, server-verified receipt, fee balance and course access. The agent has not made a real payment or validated live credentials. Test a cancellation as well. Never enter the M-Pesa PIN on the school site.

The provider's current integration contract is documented at https://megapay.co.ke/documentation/ (STK `/backend/v1/initiatestk`, status `/backend/v1/transactionstatus`). The implementation uses these fixed HTTPS hosts; it does not accept a client-supplied payment destination or provider URL.

## Student experience

- Paid course → **Pay an instalment & enroll** → `/fees?course=<id>`.
- Choose an amount (whole KES, at most the remaining balance and KES 150,000/request), enter a Kenyan M-Pesa number, then confirm the prompt.
- Pending requests poll for approximately two minutes. **Check payment status** remains available afterward; webhooks also trigger verification.
- **Fees & receipts** in the account/mobile menu lists fee statements. Each statement records amount, status, timestamp, masked phone, school reference and confirmed M-Pesa receipt.
- A verified payment and any enrolment earned by reaching the quoted access deposit are written in the same database transaction. Subsequent instalments reduce the balance without duplicating enrolment.
- Existing enrolments remain accessible. Their historical paid amounts are unknown and are not fabricated or charged again. Ask the school to reconcile any previous balance separately.
- Each account's total is quoted on its first request, including an unsuccessful attempt. Later course price changes apply to new student quotes, not existing accounts.

## Verification and recovery

Unsigned callbacks are hints, **never proof of payment**. The backend calls MegaPay's authenticated transaction-status API and checks the stored provider ID, reference, amount, phone, successful status/code and receipt. Unknown callbacks do not create records. Repeated callbacks/checks cannot duplicate receipts or credit a fee twice. Phone numbers are masked in API responses, and provider payloads/keys are not logged.

Serializable transactions, one unique active payment per student/course, and idempotent request UUIDs prevent parallel reservations and duplicate STK submissions. A provider timeout is ambiguous: retain the reservation and ask for review instead of automatically sending another charge. Provider checks are limited to once/10 seconds per payment; initiation attempts are limited to 10 per student/15 minutes.

In Admin → Payment ledger, check a Pending request with **Verify with MegaPay**. For an unresolved Initiating request, locate the exact school reference in General → Transactions and use **Recover provider request** with its transaction request ID (not the M-Pesa receipt). Recovery verifies the reference, phone and amount before linking, then applies the normal status checks. It cannot manually mark a payment paid.

Review records require comparison with MegaPay support. There is deliberately no arbitrary paid/failed override or auto-release for ambiguous payments. If MegaPay confirms no request exists after an initiation timeout, an audited operational reconciliation is still required; the UI will not risk creating a duplicate charge. Refunds, offline/bank payment allocation and historical balance imports are not implemented. Financial records prevent deleting their course; archive it instead.

## Validation

- API and Next.js production builds.
- `apps/api/tests/payments.cjs`: 17 tests against a real isolated PostgreSQL database with a fake provider. Includes serializable concurrent requests, first-instalment access, balance/overpayment checks, receipt replay, forged callbacks, cancellation, timeout, ownership, fee validation, legacy enrolment preservation and recovery.
- The test refuses any database except `127.0.0.1/.../ef_payment_test`. Apply migrations to that disposable database first; never substitute the production URL.
- HTTP QA: anonymous requests rejected, Student/Tutor fee and ledger access rejected, malformed payment amount rejected, unsigned callback accepted only as a hint and verified server-side.
- Browser QA: admin fee confirmation and save; student amount/phone confirmation; fake successful instalment/receipt/access; responsive overflow and light/dark checks.
- No production course fee was set, no existing enrolment was modified, and no real STK prompt was sent for QA.

To run the integration tests after API build:

```sh
DATABASE_URL=postgresql://robert@127.0.0.1:55437/ef_payment_test \
DIRECT_URL=postgresql://robert@127.0.0.1:55437/ef_payment_test \
node apps/api/tests/payments.cjs
```
