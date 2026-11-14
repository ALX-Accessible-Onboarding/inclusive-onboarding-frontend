// Client-side validation returning plain, human-friendly error messages

export function validateName(value, lang = 'en') {
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));
  if (!value || !String(value).trim()) {
    return isAm ? 'እባክዎ ምን ብለን እንደምንጠራዎት ይንገሩን።' : 'Please tell us what to call you.';
  }
  if (String(value).trim().length < 2) {
    return isAm ? 'ስም ቢያንስ 2 ፊደላት መሆን አለበት።' : 'Name must be at least 2 characters.';
  }
  return null;
}

export function validateContact(type, value, lang = 'en') {
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));

  if (!value || !String(value).trim()) {
    if (type === 'email') {
      return isAm
        ? 'እባክዎ የኢሜይል አድራሻዎን ያስገቡ።'
        : 'Please add your email address, like name@example.com.';
    }
    if (type === 'phone') {
      return isAm
        ? 'እባክዎ በ 09 ወይም 07 የሚጀምር ባለ 10 አሃዝ የስልክ ቁጥርዎን ያስገቡ (ለምሳሌ፡ 0912345678)።'
        : 'Please add your 10-digit phone number starting with 09 or 07 (e.g. 0912345678).';
    }
    return isAm
      ? 'እባክዎ በ 09 ወይም 07 የሚጀምር ባለ 10 አሃዝ የስልክ ቁጥርዎን ወይም የኢሜይል አድራሻዎን ያስገቡ።'
      : 'Please add your 10-digit phone number (starting with 09 or 07) or a valid email address.';
  }

  const clean = String(value).trim();
  const effectiveType = (type === 'auto' || !type)
    ? (clean.includes('@') || /[a-zA-Z]/.test(clean) ? 'email' : 'phone')
    : type;

  if (effectiveType === 'email') {
    // Email regex: user + @ + domain + 2+ letter TLD
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) {
      return isAm
        ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ (ለምሳሌ፡ name@example.com)።'
        : 'Please enter a valid email address in an appropriate format (e.g. name@example.com).';
    }
    return null;
  }

  // Phone validation: MUST BE 10 DIGITS STARTING WITH 09 OR 07
  // Check for disallowed letters
  if (/[a-zA-Z]/.test(clean)) {
    return isAm
      ? 'የስልክ ቁጥር ፊደላትን መያዝ አይችልም። እባክዎ በ 09 ወይም በ 07 የሚጀምር ባለ 10 አሃዝ ቁጥር ብቻ ያስገቡ።'
      : 'Phone number cannot contain letters. Please enter a 10-digit number starting with 09 or 07.';
  }

  // Count digits
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length !== 10 || (!digits.startsWith('09') && !digits.startsWith('07'))) {
    return isAm
      ? 'የስልክ ቁጥር በትክክል 10 አሃዞች ሆኖ በ 09 ወይም በ 07 መጀመር አለበት (ለምሳሌ፡ 0912345678 ወይም 0712345678)።'
      : 'Phone number must be exactly 10 digits starting with 09 or 07 (e.g. 0912345678 or 0712345678).';
  }

  return null;
}

export function validateIdNumber(route, value, lang = 'en') {
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));

  // If referral route, no document number needed
  if (route === 'referral') return null;

  // If empty or whitespace, it is optional at this stage ("Skip and add later")
  if (!value || !String(value).trim()) {
    return null;
  }

  const clean = String(value).trim();
  const effectiveRoute = route || 'kebele';

  if (effectiveRoute === 'kebele') {
    // Kebele ID format: e.g. 12345/AA, 12345-AA, AA/12345, KEB-9988
    const kebeleRegex = /^(?:[A-Za-z]{2,4}[\/\-]\d{3,8}|\d{3,8}[\/\-][A-Za-z]{2,4}|[A-Za-z0-9]{3,8}[\/\-][A-Za-z0-9]{2,6})$/;
    if (!kebeleRegex.test(clean)) {
      return isAm
        ? 'እባክዎ እንደ 12345/AA ወይም KEB-1234 ያለ ትክክለኛ የቀበሌ መታወቂያ ቅርጸት ያስገቡ (ወይም ለመዝለል ባዶ ይተዉት)።'
        : 'Please enter a valid Kebele ID format, like 12345/AA or KEB-1234 (or leave blank to skip).';
    }
    return null;
  }

  if (effectiveRoute === 'passport') {
    // Passport format: 1 or 2 letters followed by 6 to 9 digits (e.g. EP1234567 or P12345678)
    const passportRegex = /^[A-Za-z]{1,2}\d{6,9}$/;
    if (!passportRegex.test(clean)) {
      return isAm
        ? 'እባክዎ እንደ EP1234567 ያለ ትክክለኛ የፓስፖርት ቁጥር ያስገቡ (ወይም ለመዝለል ባዶ ይተዉት)።'
        : 'Please enter a valid passport number, like EP1234567 (or leave blank to skip).';
    }
    return null;
  }

  if (effectiveRoute === 'refugee') {
    // Refugee / UNHCR format: e.g. ETH-12345 or 123-45678
    const refugeeRegex = /^[A-Za-z0-9]{2,6}[\/\-][A-Za-z0-9]{4,10}$/;
    if (!refugeeRegex.test(clean)) {
      return isAm
        ? 'እባክዎ እንደ ETH-12345 ያለ ትክክለኛ የስደተኞች መታወቂያ ቅርጸት ያስገቡ (ወይም ለመዝለል ባዶ ይተዉት)።'
        : 'Please enter a valid Refugee ID format, like ETH-12345 (or leave blank to skip).';
    }
    return null;
  }

  // Other Government Document: alphanumeric with optional dash/slash, 4-20 characters
  const otherRegex = /^[A-Za-z0-9\/\-_]{4,20}$/;
  if (!otherRegex.test(clean)) {
    return isAm
      ? 'እባክዎ ቢያንስ 4 ፊደላት ወይም አሃዞች ያሉት ትክክለኛ የሰነድ ቁጥር ያስገቡ (ወይም ለመዝለል ባዶ ይተዉት)።'
      : 'Please enter a valid document number, at least 4 characters (or leave blank to skip).';
  }

  return null;
}
