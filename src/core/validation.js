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
        ? 'እባክዎ ባለ 12 አሃዝ የስልክ ቁጥርዎን ያስገቡ (ለምሳሌ፡ 251912345678)።'
        : 'Please add your 12-digit phone number, like 251912345678.';
    }
    return isAm
      ? 'እባክዎ ባለ 12 አሃዝ የስልክ ቁጥርዎን ወይም የኢሜይል አድራሻዎን ያስገቡ።'
      : 'Please add your 12-digit phone number or a valid email address.';
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

  // Phone validation: MUST BE ONLY 12 DIGITS
  // Check for disallowed letters
  if (/[a-zA-Z]/.test(clean)) {
    return isAm
      ? 'የስልክ ቁጥር ፊደላትን መያዝ አይችልም። እባክዎ ባለ 12 አሃዝ ቁጥር ብቻ ያስገቡ።'
      : 'Phone number cannot contain letters. Please enter a 12-digit number.';
  }

  // Count digits
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length !== 12) {
    return isAm
      ? 'የስልክ ቁጥር በትክክል 12 አሃዞች መሆን አለበት (ለምሳሌ፡ 251912345678)።'
      : 'Phone number must be exactly 12 digits (e.g. 251912345678).';
  }

  return null;
}

export function validateIdNumber(route, value, lang = 'en') {
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));
  if (route === 'referral') return null;
  // ID is optional in some contexts ("Add later"), but if entered:
  if (value && String(value).trim().length < 3) {
    return isAm
      ? 'እባክዎ ትክክለኛ የመታወቂያ ቁጥር ያስገቡ ወይም ዝለልን ይምረጡ።'
      : 'Please enter a valid ID number, or choose Skip.';
  }
  return null;
}
