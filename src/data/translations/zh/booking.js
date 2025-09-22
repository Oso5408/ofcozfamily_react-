
export const booking = {
  booking: {
    title: "預約工作空間",
    fullName: "姓名 *",
    email: "郵箱 *",
    phone: "電話 *",
    date: "日期 *",
    startTime: "開始時間 *",
    endTime: "結束時間 *",
    guests: "客人數量",
    guest: "位客人",
    purpose: "業務性質",
    purposePlaceholder: "例如：會議、工作坊、溫習...",
    specialRequests: "特殊要求",
    specialRequestsPlaceholderUpdated: "如有需要可提供枱椅（需列明數量，將盡量配合），如需使用投影器和電視，需额外付款$20",
    confirm: "確認預約 🐾",
    agreeTerms: "我同意以上條款及細則",
    termsTitle: "預約條款及細則",
    upTo: "最多",
    missingInfo: "信息缺失",
    missingDesc: "請填寫所有必填字段以完成預約。",
    phoneRequired: "電話號碼為必填項。",
    confirmed: "🐱 預約已提交！",
    confirmedDesc: "您對{roomName}的預約正在等待確認。我們將盡快通知您！",
    confirmedEmailDesc: "您將很快收到來自 ofcozfamily@gmail.com 的確認郵件。",
    modified: "🐱 預約已修改！",
    modifiedDesc: "您的預約已修改，正在等待重新確認。",
    adminConfirmed: "🐱 預約已確認！",
    adminConfirmedDesc: "您對{roomName}的預約已確認。",
    timeConflict: "時間衝突",
    timeConflictDesc: "此房間在所選時間已被預約。請選擇其他時間。",
    cancelSuccess: "預約已取消",
    cancelSuccessDesc: "您的預約已成功取消。",
    cancelError: "無法取消",
    cancelErrorDesc: "預約只能在開始時間前至少48小時取消。",
    cancellationWaiverUsed: "已使用本月取消豁免。",
    insufficientTokens: "代幣不足",
    insufficientTokensDesc: "此預約需要{required}個代幣，但您只有{available}個代幣。",
    tokensRequired: "需要代幣：{count}個",
    tokensDeducted: "代幣已扣除",
    tokensDeductedDesc: "已從您的帳戶扣除{count}個代幣。",
    tokensRefunded: "代幣已退還",
    tokensRefundedDesc: "已向您的帳戶退還{count}個代幣。",
    price: "價格: HK${price}/小時",
    totalPrice: "總價: HK${total}",
    bookingType: "預約類型",
    token: "代幣",
    cash: "現金",
    rentalType: "租用類型",
    hourly: "時租",
    daily: "日租",
    monthly: "月租",
    package: "套票",
    oneDayPassPackageInfo: "一次過購買20次 one day pass，費用為$1000",
    timeSlot: "時段",
    selectTime: "選擇時間",
    selectTimeSlot: "選擇時段",
    cashPaymentNote: "請按照聯絡方式進行支付。訂單將在收到付款後確認。",
    paymentContactTitle: "聯絡我們付款",
    paymentContactSubtitle: "提交訂單後我們會盡快回覆你！謝謝！",
    whatsappLink: "WhatsApp查詢",
    emailLink: "電郵查詢",
    bookingMonth: "預約月份 *",
    contactUs: "聯絡我們",
    businessPurposes: {
      "教學": "教學",
      "心理及催眠": "心理及催眠",
      "會議": "會議",
      "工作坊": "工作坊",
      "溫習": "溫習",
      "動物傳心": "動物傳心",
      "古法術枚": "古法術枚",
      "直傳靈氣": "直傳靈氣",
      "其他": "其他",
    },
    otherPurposePlaceholder: "請註明其他用途...",
    status: {
      pending: "待確認",
      confirmed: "已確認",
      cancelled: "已取消",
      modified: "已修改",
      paid: "已付款",
      processing: "處理中"
    },
    terms: `👀 客戶及使用者守則：

**為享有舒適環境，共享空間場地，不作妨礙他人上課，請保持安靜，非場地使用者 ( 家長、陪同者 ），請勿於場內逗留，亦避免'過早到達'接送子女；

*若情況許可，提供15分鐘課前預備，進房前請先通知職員，不得擅自內進；

*為免影響其他客戶，務必「準時」交回房間，請保持整潔及下課後取回個人物品、房間內不可進食，敬請合作。（逾時者需按1小時計算）；

*如套票客戶需取消訂單，可享代幣豁免優惠如下：
- 提前 48 小時以上取消：每月只可享 3 次 豁免
- 提前不足 48 小時取消：每月只可享 1 次 豁免
（ 即每月最多享有3個預約取消，不足48小時亦計算在內,如超過3個預約取消，將扣減是次代幣，客戶請自行於系統取消，缺席者將不獲退幣 ）　

*套票付款後及過期之代幣將不獲退款；
過期後之餘額，不得轉讓，到期日180日內續套票可接續餘數；

*時租預訂取消及重約規定
- 時租預訂一經確認並付款後，取消將不予退款。
- 請於取消日起 90 日內完成重新預約。

特殊情況
- 若預訂不足 48 小時取消或未按預訂時間出席，將不予退款。
- 此類情況亦無法安排重新預約。

*請善用房間資源；

*請自行往儲物室提取所需用品，用後請放回原位；

*因應當日情況下，本中心有權臨時調動房間作特別安排，不作提前通知，敬請見諒；

*部分課程需在昏暗燈光下進行，請勿擅自開啟其他房間的門，謝謝合作 ; 

*響應環保，請自備有蓋水樽；

*如需用按摩床/美容床，請自備一次性床墊；

*場內有寵物（貓）🐱，若您對寵物過敏，請先自行評估是否適合進場，本公司不負相關責任，敬請見諒。

歡迎預約參觀😊`
  }
};
