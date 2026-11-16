export const isAmharic = (l) => Boolean(l && String(l).startsWith('am'));
import { SUPPORT_NEEDS, ACCOMMODATIONS } from './vocabulary.js';

// DRAFT translations: Amharic reviewed and expanded for language and speech
// consistency. Somali, Afaan Oromoo, and Tigrinya are AI-drafted (no translation
// API was reachable) and MUST be reviewed by native speakers before any claim
// of correctness. See TRANSLATION_SHEET.md.
export const LABELS = {
  support: {

    read_aloud: { en: 'Read to me', am: 'ጮክ ብሎ ማንበብ', so: 'Ii akhri', om: 'Naaf dubbisi', ti: 'ኣንብበለይ' },
    larger_text: { en: 'Larger text', am: 'ትልቅ ጽሑፍ', so: 'Qoraal weyn', om: 'Barreeffama guddatu', ti: 'ዓብዪ ጽሑፍ' },
    voice_input: { en: 'Speak instead of typing', am: 'ከመጻፍ ይልቅ በድምፅ መናገር', so: 'Ku hadal intaad qori lahayd', om: 'Barreessuu mannaa sagaleedhaan dubbadhu', ti: 'ኣብ ክንዲ ምጽሓፍ ብድምጺ ተዛረብ' },
    more_time: { en: 'More time', am: 'ተጨማሪ ጊዜ', so: 'Wakhti dheeraad ah', om: 'Yeroo dabalataa', ti: 'ተወሳኺ ግዜ' },
    sign_language: { en: 'Sign language', am: 'የምልክት ቋንቋ', so: 'Luqadda Calaamadaha', om: 'Afaan Mallattoo', ti: 'ቋንቋ ምልክት' },
    nav_label: { en: 'Main menu', am: 'ዋና ምናሌ', so: 'Liiska ugu muhiimsan', om: 'Gabatee guddaa', ti: 'ቀንዲ መና' },
    mode_label: { en: 'Simple + Icons', am: 'ቀላል + ምስሎች', so: 'Fudud + Astaamo', om: 'Salphaa + Mallattoolee', ti: 'ቐሊል + ምልክትታት' },
    modal_title: { en: 'Savanna Accessible Access', am: 'የሳቫና ተደራሽ መዳረሻ', so: 'Helitaanka Savanna ee La Heli Karo', om: 'Argamtuu Savanna', ti: 'ሳቫና ተደራሽ መእተዊ' },
    close: { en: 'Close', am: 'ዝጋ', so: 'Xir', om: 'Cufee', ti: 'ዕጾ' },
    other: { en: 'Something else', am: 'ሌላ', so: 'Wax kale', om: 'Waan biraa', ti: 'ካልኦት' }
  },
  accommodation: {

    read_aloud: { en: 'Read-aloud support', am: 'ጮክ ብሎ የማንበብ ድጋፍ', so: 'Taageerada akhriska codka', om: 'Deeggarsa dubbisa sagalee', ti: 'ድጋፍ ምንባብ ብድምጺ' },
    flexible_hours: { en: 'Flexible hours', am: 'ተለዋዋጭ የሥራ ሰዓት', so: 'Saacado dabacsan', om: 'Sa\'aatii mijaawaa', ti: 'ተጣጣፊ ሰዓታት' },
    screen_reader_friendly: { en: 'Screen-reader friendly', am: 'ለስክሪን አንባቢ ተስማሚ', so: 'Saaxiib la ah akhristaha shaashadda', om: 'Dubbisaan fuulaaf mijaawaa', ti: 'ምስ ስክሪን አንባቢ ዝሰማማዕ' },
    voice_application: { en: 'Apply by voice', am: 'በድምፅ ማመልከት', so: 'Cod ku codso', om: 'Sagaleedhaan iyyadhu', ti: 'ብድምጺ ኣመልክት' },
    extra_interview_time: { en: 'Extra interview time', am: 'ለቃለ መጠይቅ ተጨማሪ ጊዜ', so: 'Wakhti dheeraad ah oo wareysi', om: 'Yeroo dabalataa af-gaaffii', ti: 'ተወሳኺ ግዜ ቃለ-መጠይቕ' },
    sign_language_interpreter: { en: 'Sign language interpreter', am: 'የምልክት ቋንቋ አስተርጓሚ', so: 'Turjumaanka luqadda calaamadaha', om: 'Hiikkaa Afaan Mallattoo', ti: 'ተርጓሚ ቋንቋ ምልክት' },
    other: { en: 'Other', am: 'ሌላ', so: 'Kale', om: 'Kan biraa', ti: 'ካልእ' }
  }
};

export const UI_STRINGS = {
  language: { en: 'Language', am: 'ቋንቋ', so: 'Luqadda', om: 'Afaan', ti: 'ቋንቋ' },
  mode_label: { en: 'Simple + Icons', am: 'ቀላል + ምስሎች', so: 'Fudud + Astaamo', om: 'Salphaa + Mallattoolee', ti: 'ቐሊል + ምልክትታት' },
  nav_label: { en: 'Main menu', am: 'ዋና ምናሌ', so: 'Liiska ugu muhiimsan', om: 'Gabatee guddaa', ti: 'ቀንዲ መና' },
  modal_title: { en: 'Savanna Accessible Access', am: 'የሳቫና ተደራሽ መዳረሻ', so: 'Helitaanka Savanna ee La Heli Karo', om: 'Argamtuu Savanna', ti: 'ሳቫና ተደራሽ መእተዊ' },
  errorPrefix: {"en":"⚠️ Error: ","am":"⚠️ ስህተት፡ ","so":"⚠️ Khalad: ","om":"⚠️ Dogoggora: ","ti":"⚠️ ጌጋ፡ "},
  disabledReasonFirstPage: {"en":"Already on the first page","am":"ቀድሞውኑ በመጀመሪያው ገጽ ላይ ነዎት","so":"Horey ayaad ugu jirtay bogga koowaad","om":"Duraanuu fuula duraarra jirta","ti":"ድሮ ኣብ ቀዳማይ ገጽ ኣለኻ"},
  disabledReasonLastPage: {"en":"Already on the last page","am":"ቀድሞውኑ በመጨረሻው ገጽ ላይ ነዎት","so":"Horey ayaad ugu jirtay bogga ugu dambeeya","om":"Duraanuu fuula dhumaarra jirta","ti":"ድሮ ኣብ መወዳእታ ገጽ ኣለኻ"},
  disabledReasonVoiceStop: {"en":"Voice reading is already stopped","am":"የድምፅ ንባብ አስቀድሞ ቆሟል","so":"Akhriska codka mar horeba waa la joojiyay","om":"Dubbisi sagalee duraanuu dhaabbateera","ti":"ምንባብ ድምጺ ድሮ ቆይሙ ኣሎ"},
  toggleOn: {"en":"[ON]","am":"[በርቷል]","so":"[DARAN]","om":"[BANE]","ti":"[በርሀ]"},
  toggleOff: {"en":"[OFF]","am":"[ጠፍቷል]","so":"[DAMISAN]","om":"[CUFAME]","ti":"[ጠፍአ]"},
  serverWaking: {"en":"Waking up the server, please wait...","am":"ሰርቨሩ እየነቃ ነው፣ እባክዎ ትንሽ ይጠብቁ...","so":"Server-ka ayaa toosaya, fadlan sug...","om":"Serveriin ka'aa jira, maaloo eegaa...","ti":"ሰርቨር ይበራበር ኣሎ፣ በጃኹም ተጸበዩ..."},
  timeoutError: {"en":"Request timed out. Please check your connection and try again.","am":"ጥያቄው ጊዜው አልቋል። እባክዎ ኢንተርኔትዎን ይፈትሹ እና እንደገና ይሞክሩ።","so":"Codsigu wuxuu dhaafay wakhtigii. Fadlan hubi khadkaaga oo isku day mar kale.","om":"Gaaffichi yeroo dhumateera. Maaloo intarneetii keessan mirkaneeffadhaa irra deebi'aa yaalaa.","ti":"ሕቶኻ ግዜኡ ሓሊፉ። በጃኹም ኢንተርነትኩም ኣረጋጊጽኩም ደጊምኩም ፈትኑ።"},
  networkError: {"en":"Unable to connect to the server. Please verify your internet connection.","am":"ከአገልጋዩ ጋር መገናኘት አልተቻለም። እባክዎ የበይነመረብ ግንኙነትዎን ያረጋግጡ።","so":"Khadka server-ka lama heli karo. Fadlan hubi xiriirkaaga internet-ka.","om":"Serverii wajjin wal qunnamsiisuun hin danda'amne. Maaloo intarneetii keessan mirkaneeffadhaa.","ti":"ምስ ሰርቨር ምትእስሳር ኣይተኻእለን። በጃኹም ኢንተርነትኩም ኣረጋግጹ።"},
  showingSavedJobs: {"en":"Showing saved jobs (offline mode)","am":"የተቀመጡ ስራዎችን በማሳየት ላይ (ከመስመር ውጭ)","so":"Muujinaya shaqooyinka kaydsan (khadka ka baxsan)","om":"Hojiiwwan olka'aman agarsiisaa jira (sararaan ala)","ti":"ዝተዓቀቡ ስራሓት የርኢ ኣሎ (ካብ መስመር ወጻኢ)"},
  offlineNotice: {"en":"Offline mode — using cached data","am":"ከመስመር ውጭ ሁነታ — የተቀመጠ መረጃ በመጠቀም ላይ","so":"Habka khadka ka baxsan — isticmaalaya xogta kaydsan","om":"Haala sararaan ala — odeeffannoo kuufame fayyadamaa jira","ti":"ካብ መስመር ወጻኢ ሁነታ — ዝተዓቀበ ሓበሬታ ይጥቀም ኣሎ"},
  connectionRestored: {"en":"Connection restored","am":"ግንኙነቱ ተመልሷል","so":"Xiriirkii dib baa loo helay","om":"Walqunnamtiin deebi'eera","ti":"ምትእስሳር ተመሊሱ"},
  tryAgain: {"en":"Try again","am":"እንደገና ሞክር","so":"Isku day mar kale","om":"Irra deebii yaali","ti":"ደጊምካ ፈትን"},

  onboarding: { en: 'Sign Up', am: 'ይመዝገቡ', so: 'Isdiiwaangeli', om: 'Galmaa\'i', ti: 'ተመዝገብ' },
  profile: { en: 'My Profile', am: 'መገለጫዬ', so: 'Astaantayda', om: 'Seenaa Koo', ti: 'ፕሮፋይለይ' },
  career: { en: 'Career Gateway', am: 'የሥራ እድሎች', so: 'Albaabka Xirfadaha', om: 'Balbala Hojii', ti: 'ኣፍደገ ሙያ' },
  employer: { en: 'Post a Job', am: 'ሥራ ይለጥፉ', so: 'Shaqo dhig', om: 'Hojii Maxxansi', ti: 'ስራሕ ኣስነድ' },
  save: { en: 'Save', am: 'አስቀምጥ', so: 'Kaydi', om: 'Olkaa\'i', ti: 'ኣቐምጥ' },
  saving: { en: 'Saving...', am: 'በማስቀመጥ ላይ...', so: 'Waa la kaydinayaa...', om: 'Olchaa jira...', ti: 'ምቕማጥ ኣሎ...' },
  cancel: { en: 'Cancel', am: 'ሰርዝ', so: 'Ka noqo', om: 'Dhiisi', ti: 'ሰርዝ' },
  edit: { en: 'Edit', am: 'አስተካክል', so: 'Wax ka beddel', om: 'Gulaali', ti: 'ኣርም' },
  back: { en: 'Back', am: 'ተመለስ', so: 'Dib u noqo', om: 'Duubatti', ti: 'ተመለስ' },
  next: { en: 'Next', am: 'ቀጣይ', so: 'Xigta', om: 'Itti aanu', ti: 'ቀጺል' },
  submit: { en: 'Submit', am: 'አስገባ', so: 'Dir', om: 'Ergi', ti: 'ኣቕርብ' },
  submitting: { en: 'Submitting...', am: 'በማስገባት ላይ...', so: 'Waa la dirayaa...', om: 'Ergaa jira...', ti: 'ምቕራብ ኣሎ...' },
  close: { en: 'Close', am: 'ዝጋ', so: 'Xir', om: 'Cufee', ti: 'ዕጾ' },
  apply: { en: 'Apply Now', am: 'አሁን ያመልክቱ', so: 'Codso hadda', om: 'Amma Iyyadu', ti: 'ሕጂ ኣመልክት' },
  readAloud: { en: 'Read to me', am: 'ጮክ ብሎ አንብብልኝ', so: 'Ii akhri', om: 'Naaf dubbisi', ti: 'ኣንብበለይ' },
  speakToMe: { en: 'Speak to me', am: 'ጮክ ብለህ አንብብልኝ', so: 'Ila hadal', om: 'Naaf dubbadhu', ti: 'ተዛረበለይ' },
  stopReading: { en: 'Stop reading', am: 'ማንበብ አቁም', so: 'Jooji akhriska', om: 'Dubbisa dhaabi', ti: 'ምንባብ ኣቋሪጽ' },
  micStart: { en: 'Speak answer', am: 'በድምፅ ይመልሱ', so: 'Jawaabta dheh', om: 'Deebii dubbadhu', ti: 'መልሲ ተዛረብ' },
  micListening: { en: 'Listening... speak clearly', am: 'እያዳመጥኩ ነው... በግልጽ ይናገሩ', so: 'Waa la dhagaysanayaa... si cad u hadal', om: 'Dhaggeeffachaa jira... sirrii dubbadhu', ti: 'ምስማዕ ኣሎ... ብግልጺ ተዛረብ።' },
  micConfirm: { en: 'Is this right? Confirm or edit.', am: 'ይህ ትክክል ነው? ያረጋግጡ ወይም ያስተካክሉ።', so: 'Ma sax baa? Xaqiiji ama wax ka beddel.', om: 'Kun sirrii dha? Mirkaneessi yookiin gulaali.', ti: 'እዚ ቅኑዕ ድዩ? ኣረጋግጽ ወይ ኣርም።' },
  confirm: { en: 'Confirm', am: 'አረጋግጥ', so: 'Xaqiiji', om: 'Mirkaneessi', ti: 'ኣረጋግጽ' },
  privateBadge: { en: 'Private', am: 'የግል', so: 'Gaar ah', om: 'Dhuunfaa', ti: 'ብሕታዊ' },
  privateNotice: { en: 'Stored privately. No medical proof needed.', am: 'በግል የተጠበቀ። የህክምና ማረጋገጫ አያስፈልግም።', so: 'Si gaar ah ayaa loo kaydiyaa. Caddeyn caafimaad looma baahna.', om: 'Dhuunfaadhaan olkaa\'a. Ragaan fayyaa hin barbaachisu.', ti: 'ብሕታዊ ኮይኑ ይቐምጥ። ናይ ሕክምና መረጋገጺ ኣየድልን።' },
  addIdLater: { en: 'Add my ID later', am: 'መታወቂያዬን ቆይቼ አስገባለሁ', so: 'Aqoonsigayga dambe ayaan ku dari doonaa', om: 'ID koo booddee nan dabala', ti: 'መንነትይ ድሒር ክውስኾ እየ' },
  idPendingReview: { en: 'Partner referral pending review', am: 'የአጋር ድርጅት ማረጋገጫ በመጠባበቅ ላይ', so: 'Tixraaca lammaanaha ayaa sugaya dib u eegis', om: 'Ergaa michuu ilaalamuuf eegaa jira', ti: 'ናይ መሻርክቲ ሓሳብ ኣብ ምርመራ ይጽበ' },
  filterBySupport: { en: 'Support I need (filtered on your device)', am: 'የምፈልገው ድጋፍ (በመሳሪያዎ ላይ የተጣራ)', so: 'Taageerada aan u baahanahay (qalabkaaga ayaa lagu shaandheeyay)', om: 'Deeggarsa nan barbaadu (meeshaa keetirratti calalaa)', ti: 'ዝደልዮ ድጋፍ (ኣብ መሳርሒኹም ይስረ)' },
  allJobs: { en: 'All Jobs', am: 'ሁሉም ስራዎች', so: 'Dhammaan Shaqooyinka', om: 'Hojii Hundaa', ti: 'ኩሉ ስራሓት' },
  plainLanguageSummary: { en: 'Plain-language summary', am: 'ቀላል ማጠቃለያ', so: 'Soo koobid luqad fudud', om: 'Cuunfaa afaan salphaa', ti: 'ኣጸርኡ ብቐሊል ቋንቋ' },
  standardView: { en: 'Original description', am: 'መደበኛ መግለጫ', so: 'Sharaxaadda asalka ah', om: 'Ibsa jalqabaa', ti: 'ናይ መጀመርታ መግለጺ' },
  noJobsFound: { en: 'No jobs match your selected support criteria.', am: 'ከተመረጠው ድጋፍ ጋር የሚዛመድ ስራ አልተገኘም።', so: 'Shaqooyin kuma habboona shuruudaha taageerada aad dooratay.', om: 'Hojii ulaagaalee deeggarsa ati filatteetti hin mada\'ne hin jiru.', ti: 'ምንም ስራሕ ምስ መዐቀኒታት ድጋፍኹም ኣይሰማማዕን።' },
  applicationSubmitted: { en: 'Application submitted successfully!', am: 'ማመልከቻዎ በተሳካ ሁኔታ ገብቷል!', so: 'Codsiga si guul leh ayaa loo diray!', om: 'Iyyannoon milkaa\'inaan ergamte!', ti: 'ምልክታ ብዓወት ቀሪቡ!' },
  employerSuccess: { en: 'Job posted successfully!', am: 'ስራው በተሳካ ሁኔታ ተለጠፈ!', so: 'Shaqada si guul leh ayaa loo daabacay!', om: 'Hojii milkaa\'inaan maxxanfame!', ti: 'ስራሕ ብዓወት ተለጢፉ!' },
  accommodationsAvailable: { en: 'Accommodations available:', am: 'የተዘጋጁ ድጋፎች፡', so: 'Taageerooyinka la heli karo:', om: 'Mijeessitoonni argaman:', ti: 'ዝርከቡ ምቾታት:' },
  clearFilters: { en: 'Clear all filters', am: 'ሁሉንም ማጣሪያዎች አጽዳ', so: 'Dhammaan shaandhaynta nadiifi', om: 'Calaalii hunda qulqulleessi', ti: 'ኩሉ ማጣርያታት ኣጽሪ' },
  loadError: { en: 'Could not load jobs.', am: 'ስራዎችን መጫን አልተቻለም።', so: 'Shaqooyinka lama soo dejin karo.', om: 'Hojiiwwan fe\'uun hin danda\'amne.', ti: 'ስራሓት ክጽዓን ኣይተኻእለን።' },
  at: { en: 'at', am: 'በ', so: 'ka', om: 'biratti', ti: 'ኣብ' },
  description: { en: 'Description:', am: 'የሥራው ዝርዝር፡', so: 'Sharaxaad:', om: 'Ibsa:', ti: 'መግለጺ:' },
  workFromHome: { en: 'Work from home (Remote).', am: 'ሥራው ከቤት የሚሰራ ነው (የርቀት ሥራ)።', so: 'Guriga ka shaqee (Fogaan).', om: 'Manii hojjedhu (Fageenyaan).', ti: 'ካብ ገዛ ስራሕ (ርሑቕ)።' },
  trainingProvided: { en: 'Training is provided.', am: 'ስልጠና ይሰጣል።', so: 'Tababar waa la bixiyaa.', om: 'Leenjiin ni kennama.', ti: 'ስልጠና ይወሃብ።' },
  voiceReadPage: { en: 'Read this page', am: 'ይህን ገጽ አንብብልኝ', so: 'Boggan akhri', om: 'Fuula kana dubbisi', ti: 'እዚ ገጽ ኣንብብ' },
  voiceStop: { en: 'Stop voice', am: 'ድምፅ አቁም', so: 'Jooji codka', om: 'Sagalee dhaabi', ti: 'ድምጺ ኣቋሪጽ' },
  voiceCommands: { en: 'Voice commands', am: 'የድምፅ ትዕዛዞች', so: 'Awaamiirta codka', om: 'Ajajawwan sagalee', ti: 'ትእዛዛት ድምጺ' },
  voiceListening: { en: 'Listening…', am: 'እያዳመጥኩ ነው…', so: 'Waa la dhagaysanayaa…', om: 'Dhaggeeffachaa jira…', ti: 'ምስማዕ ኣሎ…' },
  voiceConsentTitle: { en: 'Use the Amharic voice service?', am: 'የአማርኛ ድምፅ አገልግሎትን መጠቀም ይፈልጋሉ?', so: 'Ma doonaysaa inaad isticmaasho adeegga codka Amxaariga?', om: 'Tajaajila sagalee Amaaraa fayyadamuu barbaaddaa?', ti: 'ናይ ኣማርኛ ድምጺ ኣገልግሎት ክትጥቀሙዶ?' },
  voiceConsentTitleGeneric: { en: 'Use the voice service?', am: 'የድምፅ አገልግሎትን መጠቀም ይፈልጋሉ?', so: 'Ma doonaysaa inaad isticmaasho adeegga codka?', om: 'Tajaajila sagalee fayyadamuu barbaaddaa?', ti: 'ናይ ድምጺ ኣገልግሎት ክትጥቀሙዶ?' },
  voiceConsentBody: { en: 'Amharic speech is made by Google Gemini. The text on this page will be sent to Google to make audio. Your typed answers, passwords and ID numbers are not sent.', am: 'የአማርኛ ንግግር በGoogle Gemini ይዘጋጃል። በዚህ ገጽ ላይ ያለው ጽሑፍ ድምፅ ለመሥራት ወደ Google ይላካል። የጻፍካቸው መልሶች፣ የይለፍ ቃሎች እና የመታወቂያ ቁጥሮች አይላኩም።', so: 'Hadalka Amxaariga waxaa sameeya Google Gemini. Qoraalka boggan waxaa loo diri doonaa Google si cod loo sameeyo. Jawaabahaaga qoran, furaha sirta ah iyo lambarada aqoonsiga lama diro.', om: 'Dubbachuun Amaaraa Google Gemini\'n hojjetama. Barreeffamni fuula kanaa gara Google ni ergama akka sagaleen hojjetamu. Deebiiwwan kee barreessan, jechoonni iccitii fi lakkoobsawwan ID hin ergaman.', ti: 'ናይ ኣማርኛ ንግግር ብGoogle Gemini ይስራሕ። ጽሑፍ እዚ ገጽ ናብ Google ድምጺ ንምስራሕ ይልኣኽ። መልስኹም እትጸሓፍዎም፣ መሕለፍትን ቁጽሪ መንነትን ኣይልኣኹን።' },
  voiceConsentBodyGeneric: { en: 'Speech in your language is made by the voice service. The text on this page will be sent to the service to make audio. Your typed answers, passwords and ID numbers are not sent.', am: 'ንግግር በድምፅ አገልግሎት ይዘጋጃል። በዚህ ገጽ ላይ ያለው ጽሑፍ ድምፅ ለመሥራት ወደ አገልግሎቱ ይላካል። የጻፍካቸው መልሶች፣ የይለፍ ቃሎች እና የመታወቂያ ቁጥሮች አይላኩም።', so: 'Hadalka luqaddaada waxaa sameeya adeegga codka. Qoraalka boggan waxaa loo diri doonaa adeegga si cod loo sameeyo. Jawaabahaaga qoran, furaha sirta ah iyo lambarada aqoonsiga lama diro.', om: 'Dubbachuun afaan keetii tajaajila sagaleen hojjetama. Barreeffamni fuula kanaa gara tajaajilaa ni ergama akka sagaleen hojjetamu. Deebiiwwan kee barreessan, jechoonni iccitii fi lakkoobsawwan ID hin ergaman.', ti: 'ንግግር ቋንቋኹም ብኣገልግሎት ድምጺ ይስራሕ። ጽሑፍ እዚ ገጽ ናብ ኣገልግሎት ድምጺ ንምስራሕ ይልኣኽ። መልስኹም እትጸሓፍዎም፣ መሕለፍትን ቁጽሪ መንነትን ኣይልኣኹን።' },
  voiceConsentSession: { en: 'Allow for this session', am: 'ለዚህ ክፍለ ጊዜ ፍቀድ', so: 'U oggolow kulankan', om: 'Yeroo kanaaf heyyami', ti: 'ንእዚ ምርካብ ፍቀዱ' },
  voiceConsentOnce: { en: 'Allow this once', am: 'ለዚህ ጊዜ ብቻ ፍቀድ', so: 'Halkan u oggolow', om: 'Al tokkoon heyyami', ti: 'ሓንሳብ ፍቀዱ' },
  voiceConsentDecline: { en: 'Not now', am: 'አሁን አይደለም', so: 'Hadda maya', om: 'Amma hin', ti: 'ሕጂ ኣይኮነን' },
  voiceDeclined: { en: 'Amharic voice is off. You can still read on screen.', am: 'የአማርኛ ድምፅ ጠፍቷል። በማያ ገጹ ላይ ማንበብ ይችላሉ።', so: 'Codka Amxaariga waa dansan yahay. Weli waad akhrin kartaa shaashadda.', om: 'Sagaleen Amaaraa cufameera. Ammas fuula irraa dubbisuu dandeessu.', ti: 'ናይ ኣማርኛ ድምጺ ጠፊኡ እዩ። ኣብ ስክሪኑ ምንባብ ትኽእሉ ኢኹም።' },
  voiceUnavailable: { en: 'Voice is not available on this device. You can still use the keyboard and type.', am: 'ድምፅ በዚህ መሣሪያ ላይ አይገኝም። ኪቦርዱን ተጠቅመው መጻፍ ይችላሉ።', so: 'Cod lagama heli karo qalabkan. Weli waad isticmaali kartaa kiiboodhka oo waad qori kartaa.', om: 'Sagaleen meeshaa kana irra hin argamu. Ammas kuushinii fayyadamuu fi barreessuu dandeessu.', ti: 'ድምጺ ኣብዚ መሳርሒ ኣይርከብን። ብቁልፍ ሰሌዳ ተጠቒምኩም ጸሓፍ ትኽእሉ ኢኹም።' },
  voiceNoVoice: { en: 'There is no spoken voice for this language on this device.', am: 'በዚህ መሣሪያ ላይ ለዚህ ቋንቋ የተነገረ ድምፅ የለም።', so: 'Qalabkan cod loogu hadlo luqaddan ma laha.', om: 'Meeshaa kana irratti sagalee afaan kanaaf dubbatamu hin jiru.', ti: 'ኣብዚ መሳርሒ ንዚ ቋንቋ ዝዛረብ ድምጺ የለን።' },
  voiceServiceUnavailable: { en: 'The Amharic voice service is not available here. If you are testing locally, run the app with Vercel dev.', am: 'የአማርኛ ድምፅ አገልግሎት እዚህ አይገኝም። በአካባቢ እየሞከሩ ከሆነ፣ መተግበሪያውን በVercel dev ያሂዱ።', so: 'Adeegga codka Amxaariga halkan lagama heli karo. Haddii aad tijaabinayso gudaha, ku socodsii barnaamijka Vercel dev.', om: 'Tajaajilli sagalee Amaaraa asitti hin argamu. Yoo naannoo keetti qoramaa jirtan, appicha Vercel dev\'n hojjechiisaa.', ti: 'ናይ ኣማርኛ ድምጺ ኣገልግሎት ኣብዚ ኣይርከብን። ኣብ ውሽጢ ትፈትኑ እንተኾይንኩም፣ መተግበሪ ብVercel dev ኣካይድዎ።' },
  voiceServiceUnavailableGeneric: { en: 'The voice service is not available here. If you are testing locally, run the app with Vercel dev.', am: 'የድምፅ አገልግሎት እዚህ አይገኝም። በአካባቢ እየሞከሩ ከሆነ፣ መተግበሪያውን በVercel dev ያሂዱ።', so: 'Adeegga codka halkan lagama heli karo. Haddii aad tijaabinayso gudaha, ku socodsii barnaamijka Vercel dev.', om: 'Tajaajilli sagalee asitti hin argamu. Yoo naannoo keetti qoramaa jirtan, appicha Vercel deviin hojjechiisaa.', ti: 'ናይ ድምጺ ኣገልግሎት ኣብዚ ኣይርከብን። ኣብ ውሽጢ ትፈትኑ እንተኾይንኩም፣ መተግበሪ ብVercel dev ኣካይድዎ።' },
  voiceNotConfigured: { en: 'The Amharic voice service is not set up yet. The server has no API key.', am: 'የአማርኛ ድምፅ አገልግሎት ገና አልተዘጋጀም። በአገልጋዩ ላይ API ቁልፍ የለም።', so: 'Adeegga codka Amxaariga weli lama dejin. Adeeguhu ma haysto furaha API.', om: 'Tajaajilli sagalee Amaaraa ammatti hin qophaa\'in. Sarvariin furtuu API hin qabu.', ti: 'ናይ ኣማርኛ ድምጺ ኣገልግሎት ኣይተዳለየን። ሰርቨር ናይ API ቁልፊ የብሉን።' },
  voiceNotConfiguredGeneric: { en: 'The voice service is not set up yet.', am: 'የድምፅ አገልግሎት ገና አልተዘጋጀም።', so: 'Adeegga codka weli lama dejin.', om: 'Tajaajilli sagalee ammatti hin jiru.', ti: 'ናይ ድምጺ ኣገልግሎት ኣይተዳለየን።' },
  voiceError: { en: 'Sorry, the voice service could not speak that. Please try again.', am: 'ይቅርታ፣ የድምፅ አገልግሎቱ ይህን ማንበብ አልቻለም። እባክዎ እንደገና ይሞክሩ።', so: 'Waan ka xumahay, adeegga codku ma sheegi karo taas. Fadlan mar kale isku day.', om: 'Dhiifama, tajaajilli sagalee san dubbisuu hin dandeenye. Maaloo irra deebii yaalaa.', ti: 'ይቕሬታ፣ ናይ ድምጺ ኣገልግሎት ንሳቶም ክዛረብ ኣይከኣለን። በጃኹም እንደገና ፈትኑ።' },
  voiceStopped: { en: 'Voice stopped.', am: 'ድምፁ ቆምቷል።', so: 'Codka waa la joojiyay.', om: 'Sagaleen dhaabate.', ti: 'ድምጺ ተኣቋሪጹ።' },
  voiceNothingToRead: { en: 'There is nothing to read on this page yet.', am: 'በዚህ ገጽ ላይ የሚነበብ ነገር ገና የለም።', so: 'Weli boggan wax lagu akhriyo ma jiraan.', om: 'Fuula kana irra ammatti waan dubbifamu hin jiru.', ti: 'ኣብዚ ገጽ ንምንባብ ዝኸውን የለን።' },
  voiceHelp: { en: 'You can say: read page, stop, help, career, profile, onboarding, post a job, next page, previous page, page 2, apply, apply 2, or click any button by name.', am: 'እነዚህን መናገር ይችላሉ፡ ገጹን አንብብ፣ አቁም፣ እርዳታ፣ የሥራ እድሎች፣ መገለጫ፣ ምዝገባ፣ ሥራ ይለጥፉ፣ ቀጣይ፣ ቀዳሚ፣ አሁን ያመልክቱ፣ ወይም የአዝራሩን ስም ይጥሩ።', so: 'Waxaad dhihi kartaa: akhri bogga, jooji, caawimo, xirfad, astaanta, diiwaangelin, shaqo dhig, bogga xiga, bogga hore, bogga 2, codso, codso 2, ama riix badhan kasta magaciisa.', om: 'Jechuu dandeessu: fuula dubbisi, dhaabi, gargaarsa, hojii, seenaa koo, galmee, hojii maxxansi, fuula itti aanu, fuula duubatti, fuula 2, iyyadu, iyyadu 2, yookiin qubee kamiyyuu maqaan isaa cuqaasaa.', ti: 'ክትብሉ ትኽእሉ: ገጽ ኣንብቡ፣ ኣቋሪጹ፣ ሓገዝ፣ ሙያ፣ ፕሮፋይለይ፣ ምዝገባ፣ ስራሕ ኣስነዱ፣ ቀጺል ገጽ፣ ናይ ቅድሚ ገጽ፣ ገጽ 2፣ ኣመልክቱ፣ ኣመልክቱ 2፣ ወይ ብስም ዝኾነ ቁልፊ ጠውቑ።' },
  voiceUnknownCommand: { en: 'I did not understand that. Say help for what you can say.', am: 'ይህን አልተረዳሁም። ምን መናገር እንደሚችሉ ለማወቅ እርዳታ ይበሉ።', so: 'Ma aan fahmin taas. Dheh caawimo si aad u ogaato waxaad dhihi karto.', om: 'San hin hubanne. Waan jechuu dandeessuuf gargaarsa jedhaa.', ti: 'ሳቶም ኣይተረዳእኩን። ሓገዝ በሉ እትኽእሉዎም ንምፍላጥ።' },
  voiceCommandError: { en: 'Voice commands did not work. Please use the keyboard or type instead.', am: 'የድምፅ ትዕዛዞች አልሰሩም። እባክዎ ኪቦርዱን ይጠቀሙ ወይም ይጻፉ።', so: 'Awaamiirta codku ma shaqayn. Fadlan isticmaal kiiboodhka ama qor.', om: 'Ajajawwan sagalee hin hojjanne. Maaloo kuushinii fayyadamaa yookiin barreessaa.', ti: 'ትእዛዛት ድምጺ ኣይሰርሐን። በጃኹም ቁልፍ ሰሌዳ ተጠቐሙ ወይ ጸሓፉ።' },
  voiceNoMicrophone: { en: 'Microphone access was denied. Voice commands need microphone permission, or you can type instead.', am: 'የማይክሮፎን ፈቃድ ተከልክሏል። የድምፅ ትዕዛዞች የማይክሮፎን ፈቃድ ያስፈልጋቸዋል፣ ወይም መጻፍ ይችላሉ።', so: 'Gelitaanka makarafoonka waa la diiday. Awaamiirta codku waxay u baahan yihiin oggolaanshaha makarafoonka, ama waad qori kartaa.', om: 'Hayyamni maaykiroofoonii haalameera. Ajajawwan sagalee hayyamni maaykiroofoonii barbaachisa, yookiin barreessuu dandeessu.', ti: 'መእተዊ ማይክሮፎን ተነጺጉ እዩ። ትእዛዛት ድምጺ ፍቓድ ማይክሮፎን የድልዩ፣ ወይ ጸሓፍ ትኽእሉ ኢኹም።' },
  guideGreeting: { en: 'Welcome to Savanna Accessible Learning.', am: 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ።', so: 'Ku soo dhawoow Barashada Savanna ee La Heli Karo.', om: 'Baga gara Barumsa Savanna Argamtuu dhuftan.', ti: 'እንኳዕ ናብ ሳቫና ተደራሽ ምምሃር ብደሓን መጻእኩም።' },
  guideGreetingFollow: { en: 'I will guide you through registration by voice, from your name until you finish.', am: 'ከስምዎ ጀምሮ እስከ ምዝገባው መጨረሻ ድረስ በድምፅ እመራዎታለሁ።', so: 'Cod ayaan ku hagayaa diiwaangelinta, laga bilaabo magacaaga ilaa aad dhammayso.', om: 'Sagaleedhaan galmee keessan, maqaa keessanii jalqabee hanga xumuraatti, nan qajeelcha.', ti: 'ካብ ስምኩም ጀሚርኩም ክሳብ እትወድኡ ብድምጺ ምዝገባ ክመርሓኩም እየ።' },
  guideMicPrompt: { en: 'To answer by voice, please allow microphone access when your browser asks.', am: 'በድምፅ ለመመለስ፣ አሳሽዎ ሲጠይቅ የማይክሮፎን ፈቃድ ይስጡ።', so: 'Si aad cod ugu jawaabto, fadlan oggolow gelitaanka makarafoonka marka biraawsarku ku weydiiyo.', om: 'Sagaleedhaan deebisuuf, maaloo yeroo biraawsariin keessan gaafatu hayyamni maaykiroofoonii kennite.', ti: 'ብድምጺ ንምምላስ፣ በጃኹም መዓስ ብራውዘርኩም ዝሓተኩም መእተዊ ማይክሮፎን ፍቀዱ።' },
  guideMicDenied: { en: 'Microphone access was blocked, so the voice guide is off. You can still use the keyboard and the buttons.', am: 'የማይክሮፎን ፈቃድ ተከልክሏል፣ ስለዚህ የድምፅ መመሪያው ጠፍቷል። ኪቦርዱን እና ቁልፎቹን መጠቀም ይችላሉ።', so: 'Gelitaanka makarafoonka waa la xannibay, sidaas darteed hagaha codku waa dansan yahay. Weli waad isticmaali kartaa kiiboodhka iyo badhamada.', om: 'Hayyamni maaykiroofoonii cufameera, kanaaf qajeelfamni sagalee cufameera. Ammas kuushinii fi qubeewwan fayyadamuu dandeessu.', ti: 'መእተዊ ማይክሮፎን ተዓጊቱ እዩ፣ ስለዚ ናይ ድምጺ መምርሒ ጠፊኡ እዩ። ብቁልፍ ሰሌዳን ቁልፍታትን ምጥቃም ትኽእሉ ኢኹም።' },
  guideMicUnavailable: { en: 'Voice input is not available in this browser, so the voice guide is off. You can still use the keyboard and the buttons.', am: 'የድምፅ ግብአት በዚህ አሳሽ ላይ አይገኝም፣ ስለዚህ የድምፅ መመሪያው ጠፍቷል። ኪቦርዱን እና ቁልፎቹን መጠቀም ይችላሉ።', so: 'Gelinta codku kuma jirto biraawsarkan, sidaas darteed hagaha codku waa dansan yahay. Weli waad isticmaali kartaa kiiboodhka iyo badhamada.', om: 'Galchuun sagalee biraawsarii kana keessatti hin argamu, kanaaf qajeelfamni sagalee cufameera. Ammas kuushinii fi qubeewwan fayyadamuu dandeessu.', ti: 'ምእታው ድምጺ ኣብዚ ብራውዘር ኣይርከብን፣ ስለዚ ናይ ድምጺ መምርሒ ጠፊኡ እዩ። ብቁልፍ ሰሌዳን ቁልፍታትን ምጥቃም ትኽእሉ ኢኹም።' },
  guideSayAnswer: { en: 'Please say your answer.', am: 'እባክዎ መልስዎን ይበሉ።', so: 'Fadlan dheh jawaabtaada.', om: 'Maaloo deebii kee jedhi.', ti: 'በጃኹም መልስኩም በሉ።' },
  guideChooseOptions: { en: 'Say the number of your choice.', am: 'የምርጫዎን ቁጥር ይበሉ።', so: 'Dheh lambarka doorashadaada.', om: 'Lakkoobsa filannoo keetii jedhi.', ti: 'ቁጽሪ ምርጫኹም በሉ።' },
  guideCheckboxDone: { en: 'Say the numbers you want, then say done to continue.', am: 'የሚፈልጓቸውን ቁጥሮች ይበሉ፣ ከዚያም ለመቀጠል ተጠናቋል ይበሉ።', so: 'Dheh lambarada aad rabto, ka dibna dheh dhammaaday si aad u sii wado.', om: 'Lakkoobsawwan barbaaddan jedhi, ergasii itti fufuuf xumurame jedhi.', ti: 'ዝደለኹዎም ቁጽሪታት በሉ፣ ድሕሪኡ ንምቅጻል ተወዲኡ በሉ።' },
  guideDidNotHear: { en: 'I did not hear you. Please speak again.', am: 'አልሰማሁም። እባክዎ እንደገና ይናገሩ።', so: 'Ma aan ku maqlin. Fadlan mar kale hadal.', om: 'Si hin dhaggeenye. Maaloo irra deebii dubbadhu.', ti: 'ኣይሰማዕኩኹምን። በጃኹም እንደገና ተዛረቡ።' },
  guideUnknownAnswer: { en: 'I did not understand that answer. Please try again.', am: 'ይህን መልስ አልተረዳሁም። እባክዎ እንደገና ይሞክሩ።', so: 'Ma aan fahmin jawaabtaas. Fadlan mar kale isku day.', om: 'Deebii sana hin hubanne. Maaloo irra deebii yaalaa.', ti: 'ነታ መልሲ ኣይተረዳእኩን። በጃኹም እንደገና ፈትኑ።' },
  guideHeard: { en: 'You said:', am: 'እርስዎ ያሉት፡', so: 'Waxaad tidhi:', om: 'Jechuu kee:', ti: 'በልኩም:' },
  guideGotIt: { en: 'Got it.', am: 'ገብቶኛል።', so: 'Waan helay.', om: 'Hubadhe.', ti: 'ተረዲኡኒ።' },
  guideSelected: { en: 'Selected:', am: 'የተመረጡት፡', so: 'La doortay:', om: 'Filatame:', ti: 'ተመሪጹ:' },
  guideNoneSelected: { en: 'Nothing selected yet.', am: 'እስካሁን ምንም አልተመረጠም።', so: 'Weli wax lama dooran.', om: 'Ammatti homtuu hin filatamne.', ti: 'እቶም ዝተመረጹ የለን።' },
  guideHelp: { en: 'Answer by voice. Say a number to choose an option. Say back to go to the previous question, repeat to hear the question again, or stop to end the voice guide.', am: 'በድምፅ ይመልሱ። አማራጭ ለመምረጥ ቁጥር ይበሉ። ወደ ቀዳሚው ጥያቄ ለመመለስ ተመለስ ይበሉ፣ ጥያቄውን እንደገና ለመስማት እንደገና ይበሉ፣ የድምፅ መመሪያውን ለማቆም አቁም ይበሉ።', so: 'Cod ku jawaab. Dheh lambar si aad u doorato xulasho. Dheh dib si aad ugu noqoto su\'aasha hore, ku celi si aad su\'aasha mar kale u maqasho, ama jooji si aad u dhammayso hagaha codka.', om: 'Sagaleedhaan deebisi. Filannoo filachuuf lakkoobsa jedhi. Gaaffii duraanitti deebi\'uuf duubatti jedhi, gaaffii irra deebii dhaggeeffachuuf irra deebi jedhi, yookiin qajeelfama sagalee xumuruuf dhaabi jedhi.', ti: 'ብድምጺ ምለሱ። ኣማራጺ ንምምራጽ ቁጽሪ በሉ። ናብ ዝሓለፈ ሕቶ ንምምላስ ተመለስ በሉ፣ ሕቶ እንደገና ንምስማዕ ደግም በሉ፣ ወይ ናይ ድምጺ መምርሒ ንምውዳእ ኣቋሪጽ በሉ።' },
  guideStopped: { en: 'Voice guide stopped.', am: 'የድምፅ መመሪያው ቆምቷል።', so: 'Hagaha codka waa la joojiyay.', om: 'Qajeelfamni sagalee dhaabate.', ti: 'ናይ ድምጺ መምርሒ ተኣቋሪጹ።' },
  guideComplete: { en: 'Congratulations! Registration completed. Welcome to Savanna!', am: 'እንኳን ደስ አለዎት! ምዝገባው ተጠናቋል። እንኳን ወደ ሳቫና ደህና መጡ!', so: 'Hambalyo! Diiwaangelintu way dhammaatay. Ku soo dhawoow Savanna!', om: 'Baga geessan! Galmeen xumurame. Baga gara Savanna dhuftan!', ti: 'እንኳዕ ደሓን! ምዝገባ ተወዲኡ። ናብ ሳቫና ብደሓን መጻእኩም!' },
  guideError: { en: 'Something went wrong with the voice guide. You can continue with the keyboard and the buttons.', am: 'በድምፅ መመሪያው ላይ ችግር ተከስቷል። በኪቦርድ እና ቁልፎች መቀጠል ይችላሉ።', so: 'Wax baa ka qaldamay hagaha codka. Waad sii wadi kartaa kiiboodhka iyo badhamada.', om: 'Qajeelfama sagalee keessatti dogongorri uumame. Kuushinii fi qubeewwan fayyadamuun itti fufuu dandeessu.', ti: 'ምስ ናይ ድምጺ መምርሒ ሽግር ተፈጢሩ። ብቁልፍ ሰሌዳን ቁልፍታትን ምቅጻል ትኽእሉ ኢኹም።' },
  guideListening: { en: 'Listening. Please speak your answer.', am: 'እያዳመጥኩ ነው። እባክዎ መልስዎን ይናገሩ።', so: 'Waa la dhagaysanayaa. Fadlan dheh jawaabtaada.', om: 'Dhaggeeffachaa jira. Maaloo deebii kee jedhi.', ti: 'ምስማዕ ኣሎ። በጃኹም መልስኩም በሉ።' },
  guideTapToStart: { en: 'Tap anywhere or press any key to start the voice guide.', am: 'የድምፅ መመሪያውን ለመጀመር በማንኛውም ቦታ ይንኩ ወይም ማንኛውንም ቁልፍ ይጫኑ።', so: 'Taabo meel kasta ama riix furaha kasta si aad u bilowdo hagaha codka.', om: 'Qajeelfama sagalee jalqabuuf bakka kamiyyuu tuqi yookiin furtuu kamiyyuu dhiibi.', ti: 'ናይ ድምጺ መምርሒ ንምጅማር ኣብ ዝኾነ ቦታ ጠውቑ ወይ ዝኾነ ቁልፊ ጸቕጡ።' },
  guideLangFallback: { en: 'Amharic voice understanding is not available on this device. Please answer with numbers or English words.', am: 'የአማርኛ ድምፅ መረዳት በዚህ መሣሪያ ላይ አይሰራም። እባክዎ ቁጥሮችን ወይም የእንግሊዝኛ ቃላትን ይጠቀሙ።', so: 'Fahanka codka Amxaariga qalabkan lagama heli karo. Fadlan ku jawaab lambarada ama ereyada Ingiriisiga.', om: 'Hubannaan sagalee Amaaraa meeshaa kana irra hin argamu. Maaloo lakkoobsaan yookiin jechoota Afaan Ingilizii deebisaa.', ti: 'ናይ ኣማርኛ ድምጺ ምርዳእ ኣብዚ መሳርሒ ኣይርከብን። በጃኹም ብቁጽሪታት ወይ ብእንግሊዝኛ ቃላት ምለሱ።' },
  guideLangFallbackGeneric: { en: 'Voice understanding in this language is not available on this device. Please answer with numbers or English words.', am: 'የድምፅ መረዳት ለዚህ ቋንቋ በዚህ መሣሪያ ላይ አይገኝም። እባክዎ ቁጥሮችን ወይም የእንግሊዝኛ ቃላትን ይጠቀሙ።', so: 'Fahanka codka luqaddan qalabkan lagama heli karo. Fadlan ku jawaab lambarada ama ereyada Ingiriisiga.', om: 'Hubannaan sagalee afaan kanaa meeshaa kana irra hin argamu. Maaloo lakkoobsaan yookiin jechoota Afaan Ingilizii deebisaa.', ti: 'ምርዳእ ድምጺ ንዚ ቋንቋ ኣብዚ መሳርሒ ኣይርከብን። በጃኹም ብቁጽሪታት ወይ ብእንግሊዝኛ ቃላት ምለሱ።' },
  guideNoVoice: { en: 'There is no spoken voice for this language on this device. The guide will continue with text on screen and listening.', am: 'በዚህ መሣሪያ ላይ ለዚህ ቋንቋ የተነገረ ድምፅ የለም። መመሪያው በጽሑፍ እና በማዳመጥ ይቀጥላል።', so: 'Qalabkan cod loogu hadlo luqaddan ma laha. Hagaha wuxuu ku sii socon doonaa qoraal shaashadda ah iyo dhegeysi.', om: 'Meeshaa kana irratti sagalee afaan kanaaf dubbatamu hin jiru. Qajeelfamni barreeffama shaashaa irratti fi dhaggeeffachuun itti fufa.', ti: 'ኣብዚ መሳርሒ ንዚ ቋንቋ ዝዛረብ ድምጺ የለን። መምርሒ ብጽሑፍ ኣብ ስክሪንን ብምስማዕን ይቕጽል።' },
  guideSkipHint: { en: 'You can say skip to leave this empty.', am: 'ባዶ ለማለፍ ዝለል ይበሉ።', so: 'Waxaad dhihi kartaa ka bood si aad tan bannaanka uga tagto.', om: 'Duwwaa dhiisuuf darbi jechuu dandeessu.', ti: 'ባዶ ንምግዳፉ ዘልል ክትብሉ ትኽእሉ ኢኹም።' },
  guideBackFirst: { en: 'You are on the first question.', am: 'በመጀመሪያው ጥያቄ ላይ ነዎት።', so: 'Waxaad joogtaa su\'aasha ugu horreysa.', om: 'Gaaffii jalqabaa irra jirtu.', ti: 'ኣብ ቀዳማይ ሕቶ ኢኹም።' },
  guideRequired: { en: 'This question needs an answer before continuing.', am: 'ይህ ጥያቄ ከመቀጠልዎ በፊት መልስ ያስፈልገዋል።', so: 'Su\'aashani waxay u baahan tahay jawaab ka hor intaadan sii wadin.', om: 'Gaaffiin kun itti fufuu dura deebii barbaada.', ti: 'እዚ ሕቶ ቅድሚ ምቅጻል መልሲ የድልዮ።' },
  guideGiveUp: { en: 'I could not hear a clear answer. The voice guide is off, but you can still type or use the buttons.', am: 'ግልጽ መልስ መስማት አልቻልኩም። የድምፅ መመሪያው ጠፍቷል፣ ግን መጻፍ ወይም ቁልፎቹን መጠቀም ይችላሉ።', so: 'Ma aan maqlin jawaab cad. Hagaha codku waa dansan yahay, laakiin weli waad qori kartaa ama waad isticmaali kartaa badhamada.', om: 'Deebii ifa hin dhaggeenye. Qajeelfamni sagalee cufameera, garuu ammas barreessuu yookiin qubeewwan fayyadamuu dandeessu.', ti: 'ግልጽ መልስ ክሰምዕ ኣይከኣልኩን። ናይ ድምጺ መምርሒ ጠፊኡ እዩ፣ ግን ጸሓፍ ወይ ቁልፍታት ተጠቐም ትኽእሉ ኢኹም።' },
  guideRetryPrompt: { en: 'Say retry to try again, or stop to end the voice guide.', am: 'እንደገና ለመሞከር እንደገና ሞክር ይበሉ፣ ለማቆም አቁም ይበሉ።', so: 'Dheh retry si aad mar kale isku daydo, ama jooji si aad u dhammayso hagaha codka.', om: 'Irra deebii yaaluuf irra deebi yaali jedhi, yookiin qajeelfama sagalee xumuruuf dhaabi jedhi.', ti: 'እንደገና ንምፍታን እንደገና ፈትን በሉ፣ ወይ ናይ ድምጺ መምርሒ ንምውዳእ ኣቋሪጽ በሉ።' },
  guideStillWorking: { en: 'Registration is still being processed. Please wait a little longer.', am: 'ምዝገባው አሁንም በመካሄድ ላይ ነው። እባክዎ ትንሽ ይጠብቁ።', so: 'Diiwaangelintu weli waa la farsamaynayaa. Fadlan in yar sug.', om: 'Galmeen ammatti adeemsa keessa jira. Maaloo xinnoo eegaa.', ti: 'ምዝገባ ኣብ ምስራሕ ኣሎ። በጃኹም ሓደገዚኡ ተጸበዩ።' },
  guideLanguagePrompt: { en: 'Choose your language. Say 1 for English, 2 for English simple with icons, 3 for Amharic, 4 for Amharic simple with icons, 5 for Somali, 6 for Oromo, 7 for Tigrinya. Or just say the language name.', am: 'ቋንቋዎን ይምረጡ። እንግሊዝኛ ከፈለጉ 1 ይበሉ፣ ቀላል እንግሊዝኛ ከፈለጉ 2 ይበሉ፣ አማርኛ ከፈለጉ 3 ይበሉ፣ ቀላል አማርኛ ከፈለጉ 4 ይበሉ፣ ሶማሊ ከፈለጉ 5 ይበሉ፣ ኦሮሞ ከፈለጉ 6 ይበሉ፣ ትግርኛ ከፈለጉ 7 ይበሉ። ወይም የቋንቋውን ስም ብለው መናገር ይችላሉ።', so: 'Dooro luqaddaada. Dheh 1 Ingiriisi, 2 Ingiriisi fudud oo leh astaamo, 3 Amxaari, 4 Amxaari fudud oo leh astaamo, 5 Soomaali, 6 Oromoo, 7 Tigrinya. Ama kaliya dheh magaca luqadda.', om: 'Afaan kee fili. 1 Ingilizii, 2 Ingilizii salphaa mallattoo waliin, 3 Amaaraa, 4 Amaaraa salphaa mallattoo waliin, 5 Soomaalii, 6 Oromoo, 7 Tigriñaa jedhi. Yookiin maqaa afaanii qofa jedhi.', ti: 'ቋንቋኹም ምረጹ። 1 ንእንግሊዝኛ፣ 2 ንእንግሊዝኛ ቀሊል ምስ ምልክትታት፣ 3 ንኣማርኛ፣ 4 ንኣማርኛ ቀሊል ምስ ምልክትታት፣ 5 ንሶማሊ፣ 6 ንኦሮሞ፣ 7 ንትግርኛ በሉ። ወይ ስም ቋንቋ ጥራይ በሉ።' }
};

// Full translations for default jobs to guarantee Amharic text and speech consistency
export const JOB_TRANSLATIONS = {
  job_1: {
    title: { en: 'Remote VA - Customer Support', am: 'የርቀት ደንበኞች አገልግሎት ረዳት', so: 'Kaaliye Fogaan ah - Taageerada Macaamiisha', om: 'Gargaartuu Fageenyaa - Deeggarsa Maamilaa', ti: 'ርሑቕ ረዳኢ - ድጋፍ ዓሚል' },
    employer: { en: 'Acme Logistics', am: 'አክሜ ሎጂስቲክስ', so: 'Acme Logistics', om: 'Acme Logistics', ti: 'ኣክሜ ሎጂስቲክስ' },
    description: {
      en: 'Answer customer questions by chat and email. Training is provided. You will work from home.',
      am: 'የደንበኞችን ጥያቄዎች በቻት እና በኢሜይል መመለስ። ስልጠና ይሰጣል። ሥራው ከቤት የሚሰራ ነው።',
      so: 'Ka jawaab suʼaalaha macaamiisha adigoo isticmaalaya sheekaysi iyo iimayl. Tababar waa la bixiyaa. Guriga ayaad ka shaqayn doontaa.',
      om: 'Gaaffilee maamilaa cataa fi iimeeliin deebisi. Leenjiin ni kennama. Manii hojjetta.',
      ti: 'ሕቶታት ዓሚል ብቻትን ኢሜይልን ምላስ። ስልጠና ይወሃብ። ስራሑ ካብ ገዛ ይስራሕ።'
    }
  },
  job_2: {
    title: { en: 'Data Entry Assistant', am: 'የመረጃ ማስገቢያ ረዳት', so: 'Kaaliyaha Gelinta Xogta', om: 'Gargaartuu Galchii Ragaa', ti: 'ረዳኢ ምእታው ሓበሬታ' },
    employer: { en: 'Blue Nile Services', am: 'ብሉ ናይል ሰርቪስስ', so: 'Blue Nile Services', om: 'Blue Nile Services', ti: 'ብሉ ናይል ሰርቪስስ' },
    description: {
      en: 'Enter records into a spreadsheet. Work is quiet and detailed. Screen readers are supported.',
      am: 'መረጃዎችን ወደ ሰንጠረዥ ማስገባት። ሥራው ጸጥ ያለና ጥንቃቄ የሚፈልግ ነው። ስክሪን አንባቢዎች ይደገፋሉ።',
      so: 'Geli diiwaannada xaashida xogta. Shaqadu waa xasilloon tahay oo faahfaahsan. Akhristayaasha shaashadda waa la taageeraa.',
      om: 'Galmeewwan gara caffeesa ragaa galchi. Hojichi callisaa fi ibsaa dha. Dubbisoonni fuulaa ni deeggaramu.',
      ti: 'መዝገባት ናብ ሰንጠረዥ ኣእትዉ። ስራሑ ጸጥ ዝበለን ዝርዝርን እዩ። ስክሪን አንባቢታት ይድገፉ።'
    }
  },
  job_3: {
    title: { en: 'Community Outreach Assistant', am: 'የማህበረሰብ ተደራሽነት ረዳት', so: 'Kaaliyaha Wacyigelinta Bulshada', om: 'Gargaartuu Hiriiruu Hawaasaa', ti: 'ረዳኢ ተደራሽነት ሕብረተሰብ' },
    employer: { en: 'Addis Community Trust', am: 'አዲስ ኮሚዩኒቲ ትረስት', so: 'Addis Community Trust', om: 'Addis Community Trust', ti: 'ኣዲስ ኮሚዩኒቲ ትረስት' },
    description: {
      en: 'Help visit local groups and share information. An interpreter is available for meetings.',
      am: 'የአካባቢ ቡድኖችን መጎብኘትና መረጃዎችን ማጋራት። ለስብሰባዎች አስተርጓሚ ይቀርባል።',
      so: 'Ka caawi booqashada kooxaha deegaanka iyo wadaagista macluumaadka. Turjumaan ayaa diyaar u ah kulamada.',
      om: 'Garee naannoo daawwachuu fi odeeffannoo qooduuf gargaari. Hiikkaan yaaʼiiwwaniif ni argama.',
      ti: 'ናይ ከባቢ ጉጅለታት ምብጻሕን ሓበሬታ ምካፋልን ሓግዝ። ንኣኼባታት ተርጓሚ ይርከብ።'
    }
  },
  job_4: {
    title: { en: 'Content Reviewer', am: 'የይዘት ገምጋሚ', so: 'Dib u eegaha Mawduuca', om: 'Sakatajaa Qabiyyeettii', ti: 'ገምጋሚ ትሕዝቶ' },
    employer: { en: 'Sunrise Media', am: 'ሰንራይዝ ሚዲያ', so: 'Sunrise Media', om: 'Sunrise Media', ti: 'ሰንራይዝ ሚዲያ' },
    description: {
      en: 'Read short articles and check them for mistakes.',
      am: 'አጫጭር ጽሑፎችን ማንበብና ስህተቶችን መፈተሽ።',
      so: 'Akhri maqaallo gaagaaban oo ka hubi khaladaadka.',
      om: 'Barreeffamawwan gabaabaa dubbisi dogongorootaaf sakattaaʼi.',
      ti: 'ሓጻር ጽሑፋት ኣንብብ ስሕተታት ፈትሽ።'
    }
  }
};

/**
 * Returns localized job fields (title, employer, description) for the target language.
 */
export function getLocalizedJob(job, lang = 'en') {
  if (!job) return job;
  const base = String(lang || 'en').toLowerCase().split(/[-_]/)[0];
  const translation = JOB_TRANSLATIONS[job.id];

  const title = (translation && translation.title && (translation.title[base] || translation.title.en))
    || (base !== 'en' && job['title_' + base])
    || job.title;

  const employer = (translation && translation.employer && (translation.employer[base] || translation.employer.en))
    || (base !== 'en' && job['employer_' + base])
    || job.employer;

  const description = (translation && translation.description && (translation.description[base] || translation.description.en))
    || (base !== 'en' && job['description_' + base])
    || job.description;

  return Object.assign({}, job, {
    title: title,
    employer: employer,
    description: description
  });
}

// Fallback phrase dictionary to translate text if an English string is passed for Amharic speech
export const TRANSLATION_MAP = {
  'welcome to savanna accessible learning': 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ',
  'please choose how you would like to proceed': 'እባክዎ እንዴት መቀጠል እንደሚፈልጉ ይምረጡ',
  'what should we call you': 'ምን ብለን እንጥራዎት',
  'your name or nickname': 'የእርስዎ ስም ወይም ቅጽል ስም',
  'how can we reach you': 'እንዴት እናገኝዎት',
  'phone number or email address': 'የስልክ ቁጥር ወይም የኢሜይል አድራሻ',
  'identification document route': 'የመታወቂያ ሰነድ መንገድ',
  'enter your id document number': 'የመታወቂያ ሰነድ ቁጥርዎን ያስገቡ',
  'support you need': 'የሚያስፈልግዎት ድጋፍ',
  'read to me': 'ጮክ ብሎ ማንበብ',
  'speak to me': 'ጮክ ብለህ አንብብልኝ',
  'larger text': 'ትልቅ ጽሑፍ',
  'speak instead of typing': 'ከመጻፍ ይልቅ በድምፅ መናገር',
  'more time': 'ተጨማሪ ጊዜ',
  'sign language': 'የምልክት ቋንቋ',
  'remote va - customer support': 'የርቀት ደንበኞች አገልግሎት ረዳት',
  'data entry assistant': 'የመረጃ ማስገቢያ ረዳት',
  'community outreach assistant': 'የማህበረሰብ ተደራሽነት ረዳት',
  'content reviewer': 'የይዘት ገምጋሚ',
  'acme logistics': 'አክሜ ሎጂስቲክስ',
  'blue nile services': 'ብሉ ናይል ሰርቪስስ',
  'addis community trust': 'አዲስ ኮሚዩኒቲ ትረስት',
  'sunrise media': 'ሰንራይዝ ሚዲያ',
  'training is provided': 'ስልጠና ይሰጣል',
  'work from home': 'ሥራው ከቤት የሚሰራ ነው',
  'accommodations provided': 'የተዘጋጁ ድጋፎች',
  'description': 'የሥራው ዝርዝር'
};

/**
 * Auto-translates English phrase to Amharic if target language is Amharic.
 */
export function translateToAmharic(text) {
  if (!text || typeof text !== 'string') return text;
  // If already contains Amharic/Ethiopic script, return as is
  if (/[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/.test(text)) {
    return text;
  }
  let translated = text;
  Object.keys(TRANSLATION_MAP).forEach(engKey => {
    const re = new RegExp(engKey, 'gi');
    if (re.test(translated)) {
      translated = translated.replace(re, TRANSLATION_MAP[engKey]);
    }
  });
  return translated;
}

// label('accommodation', 'flexible_hours', 'am') -> Amharic text, falls back to English
export function label(group, value, lang) {
  const entry = LABELS[group] && LABELS[group][value];
  if (!entry) return value;
  return entry[lang] || entry.en;
}

export function t(key, lang) {
  const code = String(lang || 'en').toLowerCase().split(/[-_]/)[0];
  if (UI_STRINGS[key]) {
    return UI_STRINGS[key][code] || UI_STRINGS[key].en;
  }
  if (LABELS.support && LABELS.support[key]) {
    return LABELS.support[key][code] || LABELS.support[key].en;
  }
  return key;
}

// Every English UI string, for speech: when a label has no
// translation yet, t() returns the English text, and the voice must
// speak that text in English — never with another language's voice.
// (Only exact label strings match; real Somali, Oromo, or Tigrinya
// content never equals an English label.)
const ENGLISH_LABEL_TEXTS = new Set();
Object.keys(UI_STRINGS).forEach(function (key) {
  if (UI_STRINGS[key].en) ENGLISH_LABEL_TEXTS.add(UI_STRINGS[key].en);
});
export function isEnglishLabelText(text) {
  return ENGLISH_LABEL_TEXTS.has(String(text == null ? '' : text).trim());
}

// Dev check: returns the list of vocabulary values that lack a label (should be empty)
export function missingLabels() {
  const missing = [];
  [['support', SUPPORT_NEEDS], ['accommodation', ACCOMMODATIONS]].forEach(function (pair) {
    pair[1].forEach(function (value) {
      ['en', 'am'].forEach(function (lang) {
        if (!(LABELS[pair[0]][value] && LABELS[pair[0]][value][lang])) {
          missing.push(pair[0] + ':' + value + ':' + lang);
        }
      });
    });
  });
  return missing;
}
