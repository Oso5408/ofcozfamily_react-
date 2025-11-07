
export const booking = {
  booking: {
    title: "Book Your Workspace",
    fullName: "Full Name *",
    email: "Email *",
    phone: "Phone *",
    useAccountInfo: "Use my account information",
    date: "Date *",
    startTime: "Start Time *",
    endTime: "End Time *",
    dateFilters: {
      allDates: "All Dates",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      selectDate: "Select Date"
    },
    guests: "Number of Guests",
    guest: "guest",
    purpose: "Business Nature",
    purposePlaceholder: "e.g., Meeting, Workshop, Study...",
    equipment: "Equipment Requirements *",
    equipmentType: "Equipment Type *",
    equipmentQuantity: "Quantity",
    selectEquipment: "Select Equipment (Multiple selections allowed)",
    equipmentOptions: {
      "table": "Table",
      "chair": "Chair",
      "beautyBed": "Beauty Bed",
      "massageBed": "Massage Bed",
      "whiteboard": "Whiteboard"
    },
    specialRequests: "Remarks",
    specialRequestsPlaceholder: "We'll do our best to accommodate your special requests, e.g., number of tables/chairs needed.",
    specialRequestsPlaceholderUpdated: "Other special requests or remarks (optional)",
    confirm: "Confirm Booking 🐾",
    agreeTerms: "I agree to the terms and conditions",
    termsTitle: "Booking Terms & Conditions",
    upTo: "Up to",
    missingInfo: "Missing Information",
    missingDesc: "Please fill in all required fields to complete your booking.",
    phoneRequired: "Phone number is required.",
    confirmed: "🐱 Booking Submitted!",
    confirmedDesc: "Your reservation for {roomName} is pending confirmation. We'll notify you soon!",
    confirmedEmailDesc: "You will receive an email confirmation from ofcozfamily@gmail.com shortly.",
    modified: "🐱 Booking Modified!",
    modifiedDesc: "Your booking has been modified and is pending re-confirmation.",
    adminConfirmed: "🐱 Booking Confirmed!",
    adminConfirmedDesc: "Your reservation for {roomName} has been confirmed.",
    timeConflict: "Time Conflict",
    timeConflictDesc: "This room is already booked for the selected time. Please choose a different time.",
    cancelSuccess: "Booking Cancelled",
    cancelSuccessDesc: "Your booking has been successfully cancelled.",
    cancelError: "Cannot Cancel",
    cancelErrorDesc: "Bookings can only be cancelled at least 48 hours before the start time.",
    cancellationWaiverUsed: "Monthly cancellation waiver used.",
    insufficientTokens: "Insufficient Package",
    insufficientTokensDesc: "You need {required} BR for this booking but only have {available} BR.",
    tokensRequired: "BR Required: {count}",
    tokensDeducted: "BR Deducted",
    tokensDeductedDesc: "{count} BR have been deducted from your account.",
    tokensRefunded: "BR Refunded",
    tokensRefundedDesc: "{count} BR have been refunded to your account.",
    price: "Price: HK${price}/hour",
    totalPrice: "Total Price: HK${total}",
    brCost: "BR Required: {count}",
    brBalance: "BR Balance",
    selectPackage: "Select Package Type",
    br15Package: "BR15 Package",
    br30Package: "BR30 Package",
    br15Balance: "BR15 Balance: {balance} BR",
    br30Balance: "BR30 Balance: {balance} BR",
    insufficientBr: "Insufficient BR",
    insufficientBrDesc: "Your {packageType} balance is insufficient. This booking requires {required} BR, but you only have {available} BR.",
    dp20Package: "DP20 Package",
    dp20Balance: "DP20 Balance: {balance} visits",
    dp20Expiry: "Valid until: {date}",
    dp20Expired: "Your DP20 package has expired",
    insufficientDp20: "Insufficient DP20 Balance",
    insufficientDp20Desc: "This booking requires 1 visit, but your DP20 balance is {available}.",
    dp20PackageInfo: "Purchase 20 One Day Passes for $1000 (90-day validity).",
    dp20Required: "DP20 Required: 1 visit",
    dp20Deducted: "DP20 Visit Deducted",
    dp20DeductedDesc: "1 visit has been deducted from your DP20 balance.",
    bookingType: "Booking Type",
    token: "Package",
    cash: "Online Payment",
    rentalType: "Rental Type",
    hourly: "Hourly",
    daily: "Daily",
    monthly: "Monthly",
    package: "Package",
    oneDayPassPackageInfo: "Purchase 20 One Day Passes for $1000.",
    timeSlot: "Time Slot",
    selectTime: "Select time",
    selectTimeSlot: "Select a time slot",
    cashPaymentNote: "Please follow the contact instructions for payment. The booking will be confirmed after payment is received.",
    paymentContactTitle: "Contact Us for Payment",
    paymentContactSubtitle: "After submitting your order, we will get back to you as soon as possible. Thank you!",
    whatsappLink: "WhatsApp",
    emailLink: "Email",
    bookingMonth: "Booking Month *",
    contactUs: "Contact Us",
    businessPurposes: {
      "教學": "Teaching",
      "心理及催眠": "Psychology & Hypnosis",
      "會議": "Meeting",
      "工作坊": "Workshop",
      "溫習": "Study",
      "動物傳心": "Animal Communication",
      "古法術枚": "Ancient Rituals",
      "直傳靈氣": "Jikiden Reiki",
      "其他": "Other",
    },
    dayPassPurposes: {
      "自修": "Self-Study",
      "工作": "Work",
      "其他": "Other",
    },
    otherPurposePlaceholder: "Please specify other purpose...",
    status: {
      pending: "Awaiting Payment",
      to_be_confirmed: "To Be Confirmed",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      rescheduled: "Rescheduled"
    },
    receipt: {
      upload: "Upload Receipt",
      uploadTitle: "Upload Payment Receipt",
      uploadDesc: "Please upload your payment or transfer receipt",
      selectFile: "Select File",
      fileSelected: "File Selected",
      uploading: "Uploading...",
      uploadSuccess: "Receipt uploaded successfully",
      uploadError: "Upload failed",
      viewReceipt: "View Receipt",
      receiptUploaded: "Receipt Uploaded",
      waitingForPayment: "Waiting for Payment",
      awaitingConfirmation: "Awaiting Confirmation",
      maxSize: "Max file size: 5MB",
      allowedFormats: "Supported formats: JPG, PNG, PDF",
      dragDrop: "Drag and drop file here",
      or: "or",
      pleaseUpload: "Please upload payment receipt to complete booking",
      uploadReminder: "Please upload payment receipt in 'My Bookings'"
    },
    cancellation: {
      cancel: "Cancel Booking",
      cancelTitle: "Cancel Booking",
      cancelDesc: "Are you sure you want to cancel this booking?",
      confirmCancel: "Confirm Cancellation",
      cancelReason: "Cancellation Reason (Optional)",
      reasonPlaceholder: "Please let us know why you're cancelling...",
      policyTitle: "Cancellation Policy",
      policyRules: [
        "More than 48 hours in advance: Free for up to 3 cancellations per month",
        "Less than 48 hours in advance: Free for 1 cancellation per month",
        "Combined limit: Maximum 3 free cancellations per month",
        "Additional cancellations: 1 token will be deducted per cancellation",
        "No-show: No refund, please cancel through the system"
      ],
      hoursRemaining: "{hours} hours until booking",
      willDeductToken: "⚠️ 1 token will be deducted for this cancellation",
      freeCancel: "✓ This cancellation is free",
      monthlyStats: "This Month's Cancellations",
      freeCancellationsUsed: "{used} of {total} free cancellations used",
      freeCancellationsRemaining: "{remaining} free cancellation(s) remaining",
      insufficientTokens: "Insufficient tokens for cancellation",
      insufficientTokensDesc: "You need 1 token to cancel this booking but have {tokens} token(s)",
      cancelSuccess: "Booking Cancelled",
      cancelSuccessDesc: "Your booking has been successfully cancelled",
      cancelledWithToken: "Booking cancelled (1 token deducted)",
      cancelError: "Cancellation Failed",
      pastBooking: "Cannot cancel booking after start time",
      noShowPolicy: "No-show policy applies - no refunds",
      confirmCheckbox: "I understand the cancellation policy",
      lessThan48h: "Less than 48 hours",
      moreThan48h: "More than 48 hours",
      cancelledAt: "Cancelled at",
      cancelledBy: "Cancelled by",
      tokenDeducted: "Token deducted",
      noCancellations: "No cancellations this month"
    },
    calendar: {
      addToCalendar: "Add to Google Calendar",
      addToCalendarDesc: "Add this booking to your Google Calendar",
      addSuccess: "Opened Google Calendar",
      addSuccessDesc: "Please confirm and save the event in the popup window",
      addError: "Failed to open",
      addErrorDesc: "Unable to open Google Calendar, please try again later"
    },
    terms: `👀 Customer and User Guidelines:

**To ensure a comfortable environment in the shared space and to avoid disrupting classes, please maintain quiet. Non-venue users (parents, companions) are requested not to linger on the premises and to avoid arriving 'too early' to pick up children;

*If circumstances permit, 15 minutes of pre-class preparation time will be provided. Please notify staff before entering the room; do not enter without permission;

*To avoid affecting other customers, you must return the room "on time". Please keep it clean and collect your personal belongings after class. No eating is allowed in the rooms. Thank you for your cooperation. (Overtime will be charged by the hour);

*For package customers, token waiver benefits for cancellations are as follows:
- Cancellations made more than 48 hours in advance: Up to 3 waivers per month.
- Cancellations made less than 48 hours in advance: 1 waiver per month.
(This means a maximum of 3 booking cancellations per month. Cancellations made less than 48 hours in advance are included. If you exceed 3 cancellations, tokens for the current cancellation will be deducted. Customers should cancel through the system. Tokens will not be refunded for no-shows.)

*Paid package fees and expired tokens are non-refundable;
Expired balances are non-transferable. Renewing a package within 180 days of expiry allows the remaining balance to be carried over;

*Hourly Rental Cancellation and Rebooking Policy
- Once an hourly booking is confirmed and paid, cancellations are non-refundable.
- Please complete rebooking within 90 days from the cancellation date.

Special Circumstances
- If a booking is cancelled less than 48 hours in advance or if you do not show up at the booked time, no refund will be given.
- Rebooking is also not available in such cases.

*Please make good use of the room resources;

*Please collect necessary items from the storage room yourself and return them to their original place after use;

*The center reserves the right to make special arrangements and temporarily reassign rooms according to the situation on the day, without prior notice. We appreciate your understanding;

*Some courses need to be conducted in dim lighting. Please do not open the doors of other rooms without permission. Thank you for your cooperation;

*In support of environmental protection, please bring your own lidded water bottle;

*If you need to use a massage/beauty bed, please bring your own disposable bed sheet;

*There are pets (cats) 🐱 on the premises. If you are allergic to pets, please assess your suitability before entering. The company is not responsible for any related issues. Thank you for your understanding.

You are welcome to schedule a visit 😊`
  }
};
