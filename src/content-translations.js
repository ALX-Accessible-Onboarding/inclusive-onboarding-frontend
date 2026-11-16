// Content translations: every user-facing string that used to be an
// English/Amharic ternary in the flows, now with Somali, Afaan
// Oromoo, and Tigrinya. DRAFT — AI-drafted from knowledge (no
// translation API was reachable); native-speaker review is owed
// before any claim of correctness. Fix strings here: the key is
// the exact English text, so a key must never be edited without
// updating every call site that passes it.
//
// pickLang(en, am, lang) replaces `isAm ? am : en`: Amharic and
// English behave exactly as before; Somali/Oromo/Tigrinya come
// from this table and fall back to the English text when a key
// has no entry yet (never another language).

export const CONTENT_TRANSLATIONS = {
  "Welcome to Savanna Accessible Learning": { so: "Ku soo dhawoow Barashada Savanna ee La Heli Karo.", om: "Baga gara Barumsa Savanna Argamtuu dhuftan.", ti: "እንኳዕ ናብ ሳቫና ተደራሽ ምምሃር ብደሓን መጻእኩም።" },
  "Please choose how you would like to proceed:": { so: "Fadlan dooro sida aad rabto inaad u sii wado:", om: "Maaloo akkamitti itti fufuu akka barbaaddan filadhaa:", ti: "በጃኹም ከመይ ከም እትቅጽሉ ምረጹ፡" },
  "Select your preferred language and reading mode.": { so: "Dooro luqadda iyo habka akhriska ee aad doorbidayso.", om: "Afaanii fi haala dubbisaa ati filatte filadhu.", ti: "ቋንቋኹምን ሞደል ምንባብኩምን ምረጹ።" },
  "Welcome to Savanna Accessible Learning. Please choose your language and interface mode to get started.": { so: "Ku soo dhawoow Barashada Savanna ee La Heli Karo. Fadlan dooro luqaddaada iyo habka isdhexgalka si aad u bilowdo.", om: "Baga gara Barumsa Savanna Argamtuu dhuftan. Maaloo jalqabuuf afaan kee fi haala fayyadamaa filadhu.", ti: "እንኳዕ ናብ ሳቫና ተደራሽ ምምሃር ብደሓን መጻእኩም። ንምጅማር በጃኹም ቋንቋኹምን ሞደል መራኸቢኹምን ምረጹ።" },
  "What should we call you?": { so: "Maxaan kuugu yeedhnaa?", om: "Maqaa akkamiin siin waamna?", ti: "ብኸመይ ክንጽውዐኩም?" },
  "Your name or nickname (required):": { so: "Magacaaga ama naanaystaada (waa loo baahan yahay):", om: "Maqaa kee yookiin maqaa moggaa (barbaachisaa dha):", ti: "ስምኩም ወይ ቅጽል ስምኩም (ግዴታ)፡" },
  "Feel free to use a nickname or any name you prefer. Minimum 2 characters.": { so: "Si xor ah u isticmaal naanays ama magac kasta oo aad doorbidayso. Ugu yaraan 2 xaraf.", om: "Maqaa moggaa yookiin maqaa kamiyyuu ati barbaaddu fayyadamuu dandeessa. Xiqqaa 2 qubee.", ti: "ቅጽል ስም ወይ ዝኾነ ስም እትደልዩዎ ክትጥቀሙ ትኽእሉ ኢኹም። እንተወሓደ 2 ፊደላት።" },
  "What should we call you? You can use your first name or a nickname.": { so: "Maxaan kuugu yeedhnaa? Waxaad isticmaali kartaa magacaaga hore ama naanays.", om: "Maqaa akkamiin siin waamna? Maqaa kee jalqabaa yookiin maqaa moggaa fayyadamuu dandeessa.", ti: "ብኸመይ ክንጽውዐኩም? ቀዳማይ ስምኩም ወይ ቅጽል ስምኩም ክትጥቀሙ ትኽእሉ ኢኹም።" },
  "How can we reach you?": { so: "Sideen kuu gaadhi karnaa?", om: "Akkamitti sin qaqqabna?", ti: "ከመይ ክንረኽበኩም?" },
  "Phone number (10 digits starting with 09 or 07) or Email address (required):": { so: "Lambarka taleefanka (10 lambar oo ku bilaabma 09 ama 07) ama ciwaanka iimaylka (waa loo baahan yahay):", om: "Lakkoobsa bilbilaa (lakkoobsa 10 kan 09 yookiin 07 jalqabu) yookiin teessoo iimeelii (barbaachisaa dha):", ti: "ቁጽሪ ተለፎን (10 ኣሃዛት ብ09 ወይ 07 ዝጅምር) ወይ ኣድራሻ ኢሜይል (ግዴታ)፡" },
  "Please enter a 10-digit phone number starting with 09 or 07 (e.g. 0912345678) or a valid email address.": { so: "Fadlan geli lambar taleefan oo 10 lambar ah oo ku bilaabma 09 ama 07 (tusaale 0912345678) ama iimayl sax ah.", om: "Maaloo lakkoobsa bilbilaa 10 kan 09 yookiin 07 jalqabu (fkn. 0912345678) yookiin iimeelii sirrii galchaa.", ti: "በጃኹም ብ09 ወይ 07 ዝጅምር 10 ኣሃዛት ዘለዎ ቁጽሪ ተለፎን (ለምሳሌ፡ 0912345678) ወይ ቅኑዕ ኢሜይል ኣእትዉ።" },
  "0912345678 or name@example.com": { so: "0912345678 ama name@example.com", om: "0912345678 yookiin name@example.com", ti: "0912345678 ወይ name@example.com" },
  "How can we reach you? Please enter your 10-digit phone number starting with 09 or 07, or your email address.": { so: "Sideen kuu gaadhi karnaa? Fadlan geli lambarkaaga taleefanka ee 10-ka lambar ah ee ku bilaabma 09 ama 07, ama iimaylkaaga.", om: "Akkamitti sin qaqqabna? Maaloo lakkoobsa bilbilaa kee 10 kan 09 yookiin 07 jalqabu, yookiin iimeelii kee galchaa.", ti: "ከመይ ክንረኽበኩም? በጃኹም ብ09 ወይ 07 ዝጅምር 10 ኣሃዛት ዘለዎ ቁጽሪ ተለፎንኩም፣ ወይ ኢሜይልኩም ኣእትዉ።" },
  "Identification document route": { so: "Jidka dukumeentiga aqoonsiga", om: "Karaa sanada eenyummaa", ti: "መንገዲ ሰነድ መንነት" },
  "Choose how you would like to verify your account (required):": { so: "Dooro sida aad rabto inaad u xaqiijiso akoonkaaga (waa loo baahan yahay):", om: "Akkamitti akkaataa kee mirkaneessuu akka barbaaddu filadhu (barbaachisaa dha):", ti: "ኣካውንትኩም ከመይ ከም እትኣምኑ ምረጹ (ግዴታ)፡" },
  "Everyone is welcome. If you do not have an official document, partner referral is available.": { so: "Qof kasta waa la soo dhawaynayaa. Haddii aadan haysan dukumeenti rasmi ah, tixraaca lammaanaha waa la heli karaa.", om: "Namni hundinuu baga dha. Yoo sanada mootummaa hin qabne, ergaan michuu ni argama.", ti: "ኵሎም እንቋዕ ብደሓን መጻእኩም። ወግዓዊ ሰነድ እንተዘይብልኩም፣ ሓሳብ መሻርክቲ ክርከብ ይኽእል እዩ።" },
  "Kebele ID Card": { so: "Kaarka Aqoonsiga Kebele", om: "Kaardii Eenyummaa Kebele", ti: "ካርድ መንነት ቀበሌ" },
  "National Kebele identification card": { so: "Kaarka aqoonsiga Kebele ee qaranka", om: "Kaardii eenyummaa Kebelee biyyaalessaa", ti: "ሃገራዊ ካርድ መንነት ቀበሌ" },
  "Passport": { so: "Baasaboor", om: "Paaspoortii", ti: "ፓስፖርት" },
  "Valid national passport": { so: "Baasaboor qaran oo sax ah", om: "Paaspoortii biyyaalessaa sirrii", ti: "ቅኑዕ ሃገራዊ ፓስፖርት" },
  "Refugee ID / UNHCR": { so: "Aqoonsiga Qaxootiga / UNHCR", om: "Eenyummaa Baqataa / UNHCR", ti: "መንነት ስደተኛ / UNHCR" },
  "Official refugee registration document": { so: "Dukumeentiga diiwaangelinta rasmiga ah ee qaxootiga", om: "Sanada galmee mootummaa baqataa", ti: "ወግዓዊ ሰነድ ምዝገባ ስደተኛታት" },
  "Other Government Document": { so: "Dukumeenti Kale oo Dawladeed", om: "Sanada Mootummaa Kan Biraa", ti: "ካልእ ወግዓዊ ሰነድ" },
  "Student ID, Driver license, etc.": { so: "Aqoonsiga ardayga, liisanka darawalnimada, iwm.", om: "Eenyummaa barataa, liisensii konkolaataa, kkf.", ti: "መንነት ተምሃሪ፣ ፈቃድ ሹፌር፣ ወዘተ።" },
  "I do not have one — refer me through a partner": { so: "Ma haysto — lammaane ii soo gudbi", om: "Hin qabu — michuu naaf ergaa", ti: "የብለይን — ብመሻርክቲ ኣሕልፉኒ" },
  "No dead end. Community partner review.": { so: "Waddo xidhan ma jirto. Dib u eegis lammaanaha bulshada.", om: "Daandiin hin cufamne. Ilaala michuu hawaasaa.", ti: "ዝተዓጸወ መንገዲ የለን። ግምገማ መሻርክቲ ሕብረተሰብ።" },
  "Identification document route. Choose Kebele ID, Passport, Refugee ID, Other document, or refer me through a community partner.": { so: "Jidka dukumeentiga aqoonsiga. Dooro Aqoonsiga Kebele, Baasaboor, Aqoonsiga Qaxootiga, dukumeenti kale, ama lammaane bulsho ii soo gudbi.", om: "Karaa sanada eenyummaa. Eenyummaa Kebele, Paaspoortii, Eenyummaa Baqataa, Sanada kan biraa filadhu, yookiin michuu hawaasaan naaf ergaa.", ti: "መንገዲ ሰነድ መንነት። መንነት ቀበሌ፣ ፓስፖርት፣ መንነት ስደተኛ፣ ካልእ ሰነድ ምረጹ፣ ወይ ብመሻርክቲ ሕብረተሰብ ኣሕልፉኒ።" },
  "Enter your ID document number": { so: "Geli lambarka dukumeentiga aqoonsigaaga", om: "Lakkoobsa sanada eenyummaa keetii galchi", ti: "ቁጽሪ ሰነድ መንነትኩም ኣእትዉ" },
  "Document number (optional now):": { so: "Lambarka dukumeentiga (hadda waa ikhtiyaari):", om: "Lakkoobsa sanadaa (amma filannoo dha):", ti: "ቁጽሪ ሰነድ (ሕጂ ብምርጫኹም)፡" },
  "For example: 12345/AA. You can also skip this and add it later.": { so: "Tusaale ahaan: 12345/AA. Waxaad sidoo kale ka boodi kartaa oo aad dambe ku dari kartaa.", om: "Fakkeenyaaf: 12345/AA. Darbitee booddee dabaluu dandeessa.", ti: "ለምሳሌ፡ 12345/AA። ዘልልኩም ድሒር ምውሳኽ ትኽእሉ ኢኹም።" },
  "e.g. 12345/AA": { so: "Tusaale: 12345/AA", om: "Fkn. 12345/AA", ti: "ለምሳሌ 12345/AA" },
  "Enter your ID document number. For example: 12345/AA. You can type or speak it, or skip and add later.": { so: "Geli lambarka dukumeentiga aqoonsigaaga. Tusaale ahaan: 12345/AA. Waad qori kartaa ama waad sheegi kartaa, ama ka bood oo dambe ku dar.", om: "Lakkoobsa sanada eenyummaa keetii galchi. Fakkeenyaaf: 12345/AA. Barreessuu yookiin dubbachuu dandeessa, yookiin darbitee booddee dabaluu dandeessa.", ti: "ቁጽሪ ሰነድ መንነትኩም ኣእትዉ። ለምሳሌ፡ 12345/AA። ጸሓፍ ወይ ተዛረብ ትኽእሉ ኢኹም፣ ወይ ዘልልኩም ድሒር ምውሳኽ ትኽእሉ ኢኹም።" },
  "Partner Referral Details": { so: "Faahfaahinta Tixraaca Lammaanaha", om: "Ibsa Ergaa Michuu", ti: "ዝርዝር ሓሳብ መሻርክቲ" },
  "Select your community partner organization (required):": { so: "Dooro ururka lammaanaha bulshadaada (waa loo baahan yahay):", om: "Dhaabbata michuu hawaasaa keetii filadhu (barbaachisaa dha):", ti: "ትካል መሻርክቲ ሕብረተሰብኩም ምረጹ (ግዴታ)፡" },
  "We collaborate with community partners to verify learners without traditional documents.": { so: "Waxaan la shaqaynaa lammaanayaasha bulshada si aan u xaqiijino ardayda aan haysan dukumeentiyada caadiga ah.", om: "Michuulee hawaasaa waliin ni hojjenna barattoota sanada aadaa hin qabne mirkaneessuuf.", ti: "ምስ መሻርክቲ ሕብረተሰብ ንትሓባበር ኣለና ተምሃሮ ልሙዳት ሰነዳት ዘይብሎም ንምርግጋጽ።" },
  "AAAPD (Addis Ababa Association of Persons with Disabilities)": { so: "AAAPD (Ururka Dadka Naafada ah ee Addis Ababa)", om: "AAAPD (Waldaa Namoota Hirʼina Qabanii Finfinnee)", ti: "AAAPD (ማሕበር ሰብኣት ስንክልና ኣዲስ ኣበባ)" },
  "Ethiopian National Association of the Blind / Deaf": { so: "Ururka Qaranka Itoobiya ee Dadka Indhaha laʼaanta ah / Dhegoolaha", om: "Waldaa Biyyoolessaa Itoophiyaa Namoota Ija Hin Argine / Gurra Hin Dhageenye", ti: "ማሕበር ሃገራዊት ኢትዮጵያ ንዓይነ-ስውራን / ንድንቁርናታት" },
  "UNHCR / Refugee Community Partner": { so: "UNHCR / Lammaanaha Bulshada Qaxootiga", om: "UNHCR / Michuu Hawaasaa Baqataa", ti: "UNHCR / መሻርክቲ ሕብረተሰብ ስደተኛታት" },
  "Other Community Partner": { so: "Lammaane Kale oo Bulsho", om: "Michuu Hawaasaa Kan Biraa", ti: "ካልእ መሻርክቲ ሕብረተሰብ" },
  "Select your community partner organization to complete your referral.": { so: "Dooro ururka lammaanaha bulshadaada si aad u dhammaystirto tixraacaaga.", om: "Ergaa kee xumuruuf dhaabbata michuu hawaasaa keetii filadhu.", ti: "ሓሳብኩም ንምውዳእ ትካል መሻርክቲ ሕብረተሰብኩም ምረጹ።" },
  "What are your learning goals?": { so: "Waa maxay yoolalkaaga waxbarasho?", om: "Galii barumsaa kee maali?", ti: "ዒላማታት ምምሃርኩም እንታይ እዮም?" },
  "Select what you hope to achieve (choose at least one):": { so: "Dooro waxa aad rajaynayso inaad gaadho (dooro ugu yaraan mid):", om: "Waan argachuu akka abdattu filadhu (xiqqaa tokko filadhu):", ti: "እትበጽሑዎም እትሕስቡ ምረጹ (እንተወሓደ ሓደ ምረጹ)፡" },
  "This helps us suggest the best courses and career tracks for you.": { so: "Tani waxay naga caawinaysaa inaan kuu soo jeedino koorsooyinka iyo waddooyinka xirfadaha ugu fiican.", om: "Kun koorsiiwwan fiigee fi karaa hojii siʼee akka siif yaadnu nu gargaara.", ti: "እዚ ዝበለጹ ኮርሳትን መንገዲ ሙያታትን ንምምራጽኩም ይሕግዘና።" },
  "Virtual Assistant & Remote Work": { so: "Kaaliye Farsamo & Shaqo Fogaan ah", om: "Gargaartuu Vaartualii fi Hojii Fageenyaa", ti: "ቨርችዋል ረዳኢ & ስራሕ ርሑቕ" },
  "Customer support, admin, scheduling": { so: "Taageerada macaamiisha, maamul, jadwal", om: "Deeggarsa maamilaa, bulchiinsa, sagantaa", ti: "ድጋፍ ዓሚል፣ ምሕደራ፣ መደብ" },
  "Digital & Tech Skills": { so: "Xirfadaha Dijitaalka & Tiknoolajiyadda", om: "Dandeettii Dijitaalii fi Teeknooloojii", ti: "ክእለታት ዲጂታል & ቴክኖሎጂ" },
  "Data entry, computer fundamentals": { so: "Gelinta xogta, aasaaska kombiyuutarka", om: "Galchii ragaa, buʼuura kompiitaraa", ti: "ምእታው ሓበሬታ፣ መሰረታት ኮምፒዩተር" },
  "Find an Inclusive Job": { so: "Hel Shaqo La Heli Karo", om: "Hojii Argamtuu Barbaadi", ti: "ኣካታች ስራሕ ድለ" },
  "Connect with employers offering accommodations": { so: "La xiriir loo-shaqeeyayaasha bixiya taageerooyinka", om: "Hojii dhaabota deeggarsa kennan waliin wal qunnami", ti: "ምስ ኣስራሕቲ ምቾት ዝህቡ ተራኸቡ" },
  "Earn a Recognized Certificate": { so: "Hel Shahaado La Aqoonsan Yahay", om: "Ragaa Beekamaa Argadhu", ti: "ዝተፈልጠ ምስክር ወረቐት ኣገንዮ" },
  "ALX accredited skills credential": { so: "Shahaadada xirfadaha ee ALX aqoonsatay", om: "Ragaa ogummaa ALX mirkanaaʼe", ti: "ናይ ክእለት ምስክር ወረቐት ALX ዝኣመነ" },
  "What are your learning goals? Select what you hope to achieve.": { so: "Waa maxay yoolalkaaga waxbarasho? Dooro waxa aad rajaynayso inaad gaadho.", om: "Galii barumsaa kee maali? Waan argachuu akka abdattu filadhu.", ti: "ዒላማታት ምምሃርኩም እንታይ እዮም? እትበጽሑዎም እትሕስቡ ምረጹ።" },
  "Support you need (Private)": { so: "Taageerada aad u baahan tahay (Gaar ah)", om: "Deeggarsa ati barbaaddu (Dhuunfaa)", ti: "ዝደልይዎ ድጋፍ (ብሕታዊ)" },
  "Select all accessibility accommodations you would like (optional):": { so: "Dooro dhammaan taageerooyinka helitaanka ee aad rabto (ikhtiyaari):", om: "Deeggarsa argamtuu hunda ati barbaaddu filadhu (filannoo dha):", ti: "ኩሉ ምቾት ተደራሽነት እትደልይዎ ምረጹ (ብምርጫኹም)፡" },
  "No medical proof needed. Stored privately and never shared with employers.": { so: "Caddeyn caafimaad looma baahna. Si gaar ah ayaa loo kaydiyaa weligiina loo-shaqeeyayaasha lama wadaago.", om: "Ragaan fayyaa hin barbaachisu. Dhuunfaadhaan olkaaʼama; hojii dhaabotaaf gonkuma qoodamu.", ti: "ናይ ሕክምና መረጋገጺ ኣየድልን። ብሕታዊ ኮይኑ ይቐምጥን ምስ ኣስራሕቲ ኣይካፈልን።" },
  "Support you need. Select any accessibility accommodations you would like. No medical proof is needed, and this is stored privately.": { so: "Taageerada aad u baahan tahay. Dooro taageero kasta oo helitaan ah oo aad rabto. Caddeyn caafimaad looma baahna, tanina si gaar ah ayaa loo kaydiyaa.", om: "Deeggarsa ati barbaaddu. Deeggarsa argamtuu kamiyyuu ati barbaaddu filadhu. Ragaan fayyaa hin barbaachisu, kunis dhuunfaadhaan olkaaʼama.", ti: "ዝደልይዎ ድጋፍ። ዝኾነ ምቾት ተደራሽነት እትደልይዎ ምረጹ። ናይ ሕክምና መረጋገጺ ኣየድልን፣ እዚ ድማ ብሕታዊ ኮይኑ ይቐምጥ።" },
  "Existing Profile": { so: "Akoon Jira", om: "Seenaa Jiru", ti: "ዝነበረ መገለጫ" },
  "You are already registered!": { so: "Hore ayaad u diiwaangashan tahay!", om: "Dursee galmoofteerta!", ti: "ቀደም ብሎ ተመዝጊብኩም ኢኹም!" },
  "An account with this name and phone number is already registered. You do not need to fill the rest of the form; you can proceed directly to your profile or explore accessible jobs.": { so: "Akoon magacan iyo lambarkan taleefanka leh hore ayaa loo diiwaangeliyay. Uma baahnid inaad buuxiso inta foomka ka hadhay; waxaad si toos ah u aadi kartaa astaantaada ama waxaad sahamin kartaa shaqooyinka la heli karo.", om: "Akkaawuntii maqaa fi lakkoobsa bilbilaa kanaan dursee galmoofteera. Foormii hafee guutuu hin barbaachisu; kallattiin gara seenaa keetii deemuu yookiin hojii argamtuu ilaaluu dandeessa.", ti: "ኣካውንት ብዚ ስምን ቁጽሪ ተለፎን ቀደም ብሎ ተመዝጊቡ ኣሎ። ዝተረፈ ቅጽ ኣይትምልኡን፤ ብቐጥታ ናብ መገለጫኹም ክትከዱ ወይ ተደራሺ ስራሓት ክትድሉ ትኽእሉ ኢኹም።" },
  "View My Profile": { so: "Eeg Astaantayda", om: "Seenaa Koo Ilaali", ti: "መገለጫይ ርአ" },
  "Find Accessible Jobs": { so: "Hel Shaqooyin La Heli Karo", om: "Hojii Argamtuu Barbaadi", ti: "ተደራሺ ስራሓት ድለ" },
  "Try with different details": { so: "Ku tijaabi faahfaahin kale", om: "Odeeffannoo addaatiin yaali", ti: "ብተፈላሊ ዝርዝር ፈትን" },
  "Creating your accessible profile...": { so: "Astaantaada la heli karo ayaa la abuurayaa...", om: "Seenaa kee argamtuu uumuu jira...", ti: "ተደራሽ መገለጫኹም ይስራሕ ኣሎ..." },
  "Your support preferences are stored in our isolated accommodations registry.": { so: "Doorbidyada taageeradaada waxaa lagu kaydiyaa diiwaanka hoyga ee goonida ah.", om: "Filannoo deeggarsa keetii galmee deeggarsaa addaa keessatti olkaaʼama.", ti: "ምርጫታት ድጋፍኩም ኣብ ዝተፈለየ መዝገብ ምቾት ይቐምጡ።" },
  "Error creating profile:": { so: "Khalad ayaa dhacay markii astaanta la abuurayay:", om: "Dogongora seenaa uumuu keessatti:", ti: "ጌጋ ኣብ ምስራሕ መገለጫ:" },
  "Retry": { so: "Isku day mar kale", om: "Irra deebii yaali", ti: "እንደገና ፈትን" },
  "Personal & Contact Information": { so: "Macluumaadka Shakhsi & Xiriirka", om: "Odeeffannoo Dhuunfaa fi Qunnamtii", ti: "ሓበሬታ ውልቃዊ & ተራኺብ" },
  "Contact Details": { so: "Faahfaahinta Xiriirka", om: "Ibsa Qunnamtii", ti: "ዝርዝር ተራኺብ" },
  "Referral through community partner pending review. Your access is fully active in the meantime.": { so: "Tixraaca lammaanaha bulshada ayaa sugaya dib u eegis. Gelitaankaagu si buuxda ayuu u shaqaynayaa inta lagu jiro.", om: "Ergaan michuu hawaasaa ilaalamuuf eegaa jira. Argamuun kee yeroo kana guutummaatti hojjeta.", ti: "ሓሳብ ብመሻርክቲ ሕብረተሰብ ኣብ ምርመራ ይጽበ። ኣብዚ ግዜ ምትሕትኹም ብምሉእ ይሰርሕ ኣሎ።" },
  "Document Route": { so: "Jidka Dukumeentiga", om: "Karaa Sanadaa", ti: "መንገዲ ሰነድ" },
  "Document Number": { so: "Lambarka Dukumeentiga", om: "Lakkoobsa Sanadaa", ti: "ቁጽሪ ሰነድ" },
  "No ID document is on file yet. You can add your ID now or at any time.": { so: "Weli dukumeenti aqoonsi lama kaydin. Aqoonsigaaga hadda ama wakhti kasta ayaad ku dari kartaa.", om: "Ammaatti sanadni eenyummaa hin olkaaʼamne. Eenyummaa kee amma yookiin yeroo kamiyyuu dabaluu dandeessa.", ti: "እቶም ዝተቐምጡ ሰነድ መንነት የለን። መንነትኩም ሕጂ ወይ ዝኾነ ግዜ ክትውስኹ ትኽእሉ ኢኹም።" },
  "Identification & Verification": { so: "Aqoonsi & Xaqiijin", om: "Eenyummaa fi Mirkaneessa", ti: "መንነት & ምርግጋጽ" },
  "Support You Need": { so: "Taageerada Aad U Baahan Tahay", om: "Deeggarsa Ati Barbaaddu", ti: "ዝደልይዎ ድጋፍ" },
  "Stored in an isolated support database. Employers cannot view this information.": { so: "Waxaa lagu kaydiyay xog urursan oo taageero oo gooni ah. Loo-shaqeeyayaashu ma arki karaan macluumaadkan.", om: "Kuusaa deeggarsaa addaa keessatti olkaaʼama. Hojii dhaabotni odeeffannoo kana hin ilaalan.", ti: "ኣብ ዝተፈለየ መኽዘን ሓበሬታ ድጋፍ ይቐምጥ። ኣስራሕቲ እዚ ሓበሬታ ኣይርእይዎን።" },
  "No support accommodations requested yet.": { so: "Weli taageero hoy ah lama codsan.", om: "Ammaatti deeggarsi gaafatamuu hin jiru.", ti: "እቶም ዝተሓተቱ ምቾት ድጋፍ የለን።" },
  "Support Needs": { so: "Baahiyaha Taageerada", om: "Barbaachisummaa Deeggarsaa", ti: "ድለታት ድጋፍ" },
  "Interface & Learning Preferences": { so: "Doorashooyinka Isdhexgalka & Barashada", om: "Filannoo Fayyadamaa fi Barumsaa", ti: "ምርጫታት መራኸቢ & ምምሃር" },
  "Language": { so: "Luqad", om: "Afaan", ti: "ቋንቋ" },
  "Reading / Learning Mode": { so: "Habka Akhriska / Barashada", om: "Haala Dubbisaa / Barumsaa", ti: "ሞደል ምንባብ / ምምሃር" },
  "Field updated successfully!": { so: "Goobta si guul leh ayaa loo cusboonaysiiyay!", om: "Dirreen milkaaʼinaan haaromfame!", ti: "ዓውዲ ብዓወት ተመሓይሹ!" },
  "First name or nickname is completely fine.": { so: "Magaca hore ama naanaysta gabi ahaanba waa fiican yahay.", om: "Maqaan jalqabaa yookiin maqaan moggaa guutummaatti tola.", ti: "ቀዳማይ ስም ወይ ቅጽል ስም ብምሉእ ጽቡቕ እዩ።" },
  "Contact Information": { so: "Macluumaadka Xiriirka", om: "Odeeffannoo Qunnamtii", ti: "ሓበሬታ ተራኺብ" },
  "Please enter your email address": { so: "Fadlan geli ciwaanka iimaylkaaga", om: "Maaloo teessoo iimeelii keetii galchi", ti: "በጃኹም ኣድራሻ ኢሜይልኩም ኣእትዉ" },
  "Please enter your 10-digit phone number starting with 09 or 07 (e.g. 0912345678)": { so: "Fadlan geli lambarkaaga taleefanka ee 10-ka lambar ah ee ku bilaabma 09 ama 07 (tusaale 0912345678)", om: "Maaloo lakkoobsa bilbilaa kee 10 kan 09 yookiin 07 jalqabu galchi (fkn. 0912345678)", ti: "በጃኹም ብ09 ወይ 07 ዝጅምር 10 ኣሃዛት ዘለዎ ቁጽሪ ተለፎንኩም ኣእትዉ (ለምሳሌ፡ 0912345678)" },
  "Add or Update ID Document": { so: "Ku dar ama cusboonaysii dukumeentiga aqoonsiga", om: "Sanada eenyummaa dabali yookiin haaromsi", ti: "ሰነድ መንነት ውሰኽ ወይ ኣመሓይሽ" },
  "Kebele, Passport, or Refugee ID document number": { so: "Lambarka dukumeentiga Kebele, Baasaboor, ama Aqoonsiga Qaxootiga", om: "Lakkoobsa sanadaa Kebele, Paaspoortii, yookiin Eenyummaa Baqataa", ti: "ቁጽሪ ሰነድ መንነት ቀበሌ፣ ፓስፖርት፣ ወይ ስደተኛ" },
  "You can enter your document number now or update it later.": { so: "Waad geli kartaa lambarka dukumeentigaaga hadda ama waad cusboonaysiin kartaa dambe.", om: "Lakkoobsa sanadaa keetii amma galchuu yookiin booddee haaromsuu dandeessa.", ti: "ቁጽሪ ሰነድኩም ሕጂ ኣእትዉ ወይ ድሒር ኣመሓይሽዎ ትኽእሉ ኢኹም።" },
  "Update Support You Need": { so: "Cusboonaysii Taageerada Aad U Baahan Tahay", om: "Deeggarsa Ati Barbaaddu Haaromsi", ti: "ዝደልይዎ ድጋፍ ኣመሓይሽ" },
  "Select all accommodations that help you learn and apply": { so: "Dooro dhammaan hoyga kaa caawiya inaad barato oo aad codsato", om: "Deeggarsa hunda akka barattu fi iyyattu si gargaaru filadhu", ti: "ኩሉ ምቾት ንምምሃርን ንምልክትን ዝሕግዘኩም ምረጹ" },
  "Select Language": { so: "Dooro Luqadda", om: "Afaan Filadhu", ti: "ቋንቋ ምረጹ" },
  "Select Reading / Learning Mode": { so: "Dooro Habka Akhriska / Barashada", om: "Haala Dubbisaa / Barumsaa Filadhu", ti: "ሞደል ምንባብ / ምምሃር ምረጹ" },
  "Standard detailed layout": { so: "Qaab faahfaahsan oo caadi ah", om: "Qindaaʼaa ibsaa dhaqamaa", ti: "መደበኛ ዝርዝር ኣቀማምጣ" },
  "Plain language and descriptive visual icons": { so: "Luqad fudud iyo astaamo muuqaal oo sharraxaad leh", om: "Afaan salphaa fi mallattoolee mulʼata ibsaa qaban", ti: "ቐሊል ቋንቋን ዝገልጹ ምስልታትን" },
  "Post an Inclusive Opportunity": { so: "Dhig Fursad La Heli Karo", om: "Carraa Argamtuu Maxxansi", ti: "ኣካታች ዕድል ኣስነድ" },
  "Detail the position and check off the accommodations your organization provides.": { so: "Faahfaahi booska oo calaamadee hoyga ururkaagu bixiyo.", om: "Iddoo ibsi deeggarsa dhaabbatni kee kennu mallatteessi.", ti: "ስልጣኑ ኣብራህርህ ምቾት ትካልኩም ዝህቦ ምልክት ግበር።" },
  "Job Title": { so: "Magaca Shaqada", om: "Mata duree Hojii", ti: "ርእሰ ስራሕ" },
  "Employer / Organization Name": { so: "Magaca Loo-shaqeeyaha / Ururka", om: "Maqaa Hojii Dhaabaa / Dhaabbatii", ti: "ስም ኣስራሒ / ትካል" },
  "Job Description": { so: "Sharaxaadda Shaqada", om: "Ibsa Hojii", ti: "መግለጺ ስራሕ" },
  "Describe the responsibilities, work environment, and qualifications...": { so: "Sharax masʼuuliyadaha, deegaanka shaqada, iyo shahaadooyinka...", om: "Itti gaafatamummaa, naannoo hojii fi gahumsa ibsi...", ti: "ሓላፍነት፣ ከባቢ ስራሕን ብቃትን ኣብራህርህ..." },
  "Accommodations Provided by Employer": { so: "Hoyga uu Bixiyo Loo-shaqeeyuhu", om: "Deeggarsa Hojii Dhaabaan Kennamu", ti: "ምቾት ኣስራሒ ዝህቦ" },
  "Select all adjustments, accessible tools, and supportive work arrangements you support.": { so: "Dooro dhammaan hagaajinta, qalabka la heli karo, iyo habaynta shaqada ee taageerada leh ee aad taageerto.", om: "Jijjiiramawwan, meeshaawwan argamtuu fi qindaaʼaa hojii deeggarsaa ati deeggartu hunda filadhu.", ti: "ኩሉ ምትዕርራይ፣ ተደራሺ መሳርሒታትን ዝድግፍ ኣቀማምጣ ስራሕን እትድግፍዎ ምረጹ።" },
  "Please add a job title.": { so: "Fadlan ku dar magaca shaqada.", om: "Maaloo mata duree hojii dabali.", ti: "በጃኹም ርእሰ ስራሕ ውሰኹ።" },
  "Please add the employer name.": { so: "Fadlan ku dar magaca loo-shaqeeyaha.", om: "Maaloo maqaa hojii dhaabaa dabali.", ti: "በጃኹም ስም ኣስራሒ ውሰኹ።" },
  "Please describe the job.": { so: "Fadlan sharax shaqada.", om: "Maaloo hojicha ibsi.", ti: "በጃኹም ስራሑ ኣብራህርሁ።" },
  "is now live. Job seekers can view accommodations and apply with voice or text.": { so: "hadda waa shaqaynaysaa. Shaqaale-raadsadayaashu waxay arki karaan hoyga waxayna ku codsan karaan cod ama qoraal.", om: "amma ni hojjeta. Hojii barbaadotni deeggarsa ilaaluu fi sagalee yookiin barreeffamaan iyyachuu dandaʼu.", ti: "ሕጂ ቀሪቡ ኣሎ። ስራሕ ዝደልዩ ምቾት ክርእዩ ብድምጺ ወይ ብጽሑፍ ክኣመልክቱ ይኽእሉ።" },
  "View in Job Listings": { so: "Ka eeg Liiska Shaqooyinka", om: "Tarree Hojii Keessatti Ilaali", ti: "ኣብ ዝርዝር ስራሓት ርአ" },
  "Why are you interested in this role?": { so: "Maxaad xiisaynaysaa xilkan?", om: "Maaliif gaʼee kanaaf fedhii qabda?", ti: "ስለምንታይ በዚ ስልጣን ተገዲስኩም?" },
  "Tell the employer why you are interested in this position.": { so: "U sheeg loo-shaqeeyaha sababta aad xiisaynayso booskan.", om: "Maaliif iddoo kanaaf fedhii akka qabdu hojii dhaabaaf himi.", ti: "ስለምንታይ በዚ ስልጣን ከም እትገደሱ ንኣስራሒ ንገሩ።" },
  "You can type or click the microphone to speak your response.": { so: "Waad qori kartaa ama waxaad riixi kartaa makarafoonka si aad u sheegto jawaabtaada.", om: "Barreessuu yookiin maaykiroofoonii cuqaasuu deebii kee dubbachuu dandeessa.", ti: "ጸሓፍ ወይ ማይክሮፎን ጠውቕ ብድምጺ መልስኹም ክትህቡ ትኽእሉ ኢኹም።" },
  "Please provide a brief answer to introduce yourself.": { so: "Fadlan bixi jawaab kooban oo aad naftaada ku soo bandhigayso.", om: "Maaloo deebii gabaabaa ofiin beeksisuuf kenni.", ti: "በጃኹም ሓጻር መልሲ ነብስኹም ንምልላይ ሃቡ።" },
  "Request interview support (optional)": { so: "Codso taageerada wareysiga (ikhtiyaari)", om: "Deeggarsa af-gaaffii gaafadhu (filannoo dha)", ti: "ድጋፍ ቃለ-መጠይቕ ሓተት (ብምርጫኹም)" },
  "Which accommodations would help you during the interview?": { so: "Hoygee kaa caawinaya inta wareysiga lagu jiro?", om: "Deeggarsi kami af-gaaffii keessatti si gargaara?", ti: "ኸመይ ምቾት ኣብ እዋን ቃለ-መጠይቕ ይሕግዘኩም?" },
  "No medical proof needed. Stored privately and handled by inclusive coordinators.": { so: "Caddeyn caafimaad looma baahna. Si gaar ah ayaa loo kaydiyaa waxaana gacanta ku haya isku-duwayaal la heli karo.", om: "Ragaan fayyaa hin barbaachisu. Dhuunfaadhaan olkaaʼama; qindeessitoonni argamtuu ni bulchan.", ti: "ናይ ሕክምና መረጋገጺ ኣየድልን። ብሕታዊ ኮይኑ ይቐምጥን ኣካታች ኣማሓድርቲ ይሕዞ።" },
  "Extra interview time": { so: "Wakhti dheeraad ah oo wareysi", om: "Yeroo dabalataa af-gaaffii", ti: "ተወሳኺ ግዜ ቃለ-መጠይቕ" },
  "More time to think and respond to interview questions": { so: "Wakhti badan oo aad uga fikirto oo aad uga jawaabto suʼaalaha wareysiga", om: "Yeroo dabalataa yaaduu fi gaaffilee af-gaaffiif deebisuuf", ti: "ተወሳኺ ግዜ ንምሕሳብን ንሕቶታት ቃለ-መጠይቕ ንምምላስን" },
  "Sign language interpreter": { so: "Turjumaanka luqadda calaamadaha", om: "Hiikkaa Afaan Mallattoo", ti: "ተርጓሚ ቋንቋ ምልክት" },
  "Live interpreter support provided during the interview": { so: "Taageerada turjumaanka tooska ah ee la bixiyo inta wareysiga lagu jiro", om: "Deeggarsa hiikkaa kallattii af-gaaffii keessatti kennamu", ti: "ድጋፍ ቀጥታዊ ተርጓሚ ኣብ እዋን ቃለ-መጠይቕ ዝወሃብ" },
  "Screen-reader friendly materials": { so: "Qalab saaxiib la ah akhristaha shaashadda", om: "Meeshaawwan dubbisaan fuulaaf mijaawaa", ti: "ምስ ስክሪን አንባቢ ዝሰማማዕ ነገራት" },
  "Access questions and interview materials in accessible digital formats": { so: "Hel suʼaalaha iyo qalabka wareysiga qaabab dijitaal ah oo la heli karo", om: "Gaaffilee fi meeshaawwan af-gaaffii haalota dijitaalaa argamtuun argadhu", ti: "ሕቶታትን ነገራት ቃለ-መጠይቕን ብተደራሽ ዲጂታል ቅርጽታት ኣገንዮ" },
  "Quiet environment / flexible schedule": { so: "Deegaan xasilloon / jadwal dabacsan", om: "Naannoo callisaa / sagantaa mijaawaa", ti: "ጸጥ ዝበለ ከባቢ / ተጣጣፊ መደብ" },
  "Low-distraction interview setting": { so: "Goob wareysi oo mashquul yar", om: "Iddoo af-gaaffii jeequmsa xiqqaa", ti: "ዝተሓተት ምዝጉብ ቦታ ቃለ-መጠይቕ" },
  "Other interview support": { so: "Taageero kale oo wareysi", om: "Deeggarsa af-gaaffii kan biraa", ti: "ካልእ ድጋፍ ቃለ-መጠይቕ" },
  "Specify any other accommodation you might need": { so: "Sheeg hoy kale oo aad u baahan karto", om: "Deeggarsa biraa kamiyyuu ati barbaaddu ibsi", ti: "ዝኾነ ካልእ ምቾት እትደልዩዎ ኣብራህርሁ" },
  "Your interview accommodation request was recorded privately and shared only with support coordinators. The employer does not see private medical or disability disclosures.": { so: "Codsigaaga hoyga wareysiga si gaar ah ayaa loo diiwaangeliyay waxaana lala wadaagay oo kaliya isku-duwayaalka taageerada. Loo-shaqeeyuhu ma arko shaacinta caafimaad ee gaarka ah ama naafada.", om: "Gaaffiin deeggarsa af-gaaffii keetii dhuunfaadhaan galmoofteera; qindeessitoota deeggarsaaf qofa qoodameera. Hojii dhaabaan mulʼata fayyaa dhuunfaa yookiin hirʼinaa hin argaa.", ti: "ሓሳብ ምቾት ቃለ-መጠይቕኩም ብሕታዊ ኮይኑ ተመዝጊቡ፤ ምስ ኣማሓድርቲ ድጋፍ ጥራይ ተኻፊሉ። ኣስራሒ ብሕታዊ ናይ ሕክምና ወይ ስንክልና መግለጺ ኣይርእን።" },
  "Return to Job Listings": { so: "Ku noqo Liiska Shaqooyinka", om: "Gara Tarree Hojii Deebi", ti: "ናብ ዝርዝር ስራሓት ተመለስ" },
  "🏠 Work from home (Remote).": { so: "🏠 Guriga ka shaqee (Fogaan).", om: "🏠 Manii hojjedhu (Fageenyaan).", ti: "🏠 ካብ ገዛ ስራሕ (ርሑቕ)።" },
  "📚 Training is provided.": { so: "📚 Tababar waa la bixiyaa.", om: "📚 Leenjiin ni kennama.", ti: "📚 ስልጠና ይወሃብ።" },
  "♿ Accommodations available: ": { so: "♿ Taageerooyinka la heli karo: ", om: "♿ Mijeessitoonni argaman: ", ti: "♿ ዝርከቡ ምቾታት: " },
  "Find jobs with accommodations built-in. Filtering by your needed support stays on your device and is never shared.": { so: "Hel shaqooyin hoy ku dhisan. Shaandhaynta taageerada aad u baahan tahay waxay ku sii jirtaa qalabkaaga weligiina lama wadaago.", om: "Hojii deeggarsa keessatti ijaarame barbaadi. Calaluun deeggarsa ati barbaaddu meeshaa keetii irra turu; gonkuma qoodamu.", ti: "ምቾት ዝተሃንጸሎም ስራሓት ድለ። ማጣርያ ድጋፍ እትደልይዎ ኣብ መሳርሒኹም ጥራይ ይቐምጥን ኣይካፈልን።" },
  "Search jobs by title or company...": { so: "Shaqooyinka ku raadi magac ama shirkad...", om: "Hojii mata duree yookiin dhaabbataan barbaadi...", ti: "ስራሓት ብርእሲ ወይ ብትካል ድለ..." },
  "Loading accessible opportunities...": { so: "Fursadaha la heli karo ayaa la soo dejinayaa...", om: "Carraawwan argamtuu feʼaa jira...", ti: "ተደራሺ ዕድላት ይጽዓኑ ኣለዉ..." },
  "Show all jobs without filter": { so: "Tus dhammaan shaqooyinka shaandhayn laʼaan", om: "Hojii hunda calaluu malee agarsiisi", ti: "ኩሉ ስራሓት ብዘይ ማጣርያ ኣርኢ" },
  "Jobs pagination": { so: "Bogagga shaqooyinka", om: "Fuulawwan hojii", ti: "ገጻት ስራሓት" },
  "Previous": { so: "Hore", om: "Duraanii", ti: "ናይ ቅድሚ" },
  "Next": { so: "Xigta", om: "Itti aanu", ti: "ቀጺል" },
  "Skip and add later": { so: "Ka bood oo dambe ku dar", om: "Darbi booddee dabali", ti: "ዘልል ድሒር ውሰኽ" },
  "Please select at least one option to continue.": { so: "Fadlan dooro ugu yaraan hal xulasho si aad u sii wado.", om: "Maaloo itti fufuuf xiqqaa filannoo tokko filadhu.", ti: "በጃኹም ንምቅጻል እንተወሓደ ሓደ ኣማራጺ ምረጹ።" },
  "Please choose an option to continue.": { so: "Fadlan dooro xulasho si aad u sii wado.", om: "Maaloo itti fufuuf filannoo tokko filadhu.", ti: "በጃኹም ንምቅጻል ኣማራጺ ምረጹ።" },
  "This question is required. Please provide an answer.": { so: "Suʼaashani waa loo baahan yahay. Fadlan bixi jawaab.", om: "Gaaffiin kun barbaachisaa dha. Maaloo deebii kenni.", ti: "እዚ ሕቶ ግዴታ እዩ። በጃኹም መልሲ ሃቡ።" },
  "Please tell us what to call you.": { so: "Fadlan noo sheeg waxa aan kuugu yeedhno.", om: "Maaloo maqaa akkamiin akka sin waamnu nuuf himi.", ti: "በጃኹም ብኸመይ ከም እንጽውዐኩም ንገሩና።" },
  "Name must be at least 2 characters.": { so: "Magacu waa inuu ahaadaa ugu yaraan 2 xaraf.", om: "Maqaan xiqqaa qubee 2 qabaachuu qaba.", ti: "ስም እንተወሓደ 2 ፊደላት ክህልዎ ኣለዎ።" },
  "Please add your email address, like name@example.com.": { so: "Fadlan ku dar ciwaanka iimaylkaaga, sida name@example.com.", om: "Maaloo teessoo iimeelii keetii dabali, akka name@example.com.", ti: "በጃኹም ኣድራሻ ኢሜይልኩም ውሰኹ፣ ከም name@example.com።" },
  "Please add your 10-digit phone number starting with 09 or 07 (e.g. 0912345678).": { so: "Fadlan ku dar lambarkaaga taleefanka ee 10-ka lambar ah ee ku bilaabma 09 ama 07 (tusaale 0912345678).", om: "Maaloo lakkoobsa bilbilaa kee 10 kan 09 yookiin 07 jalqabu dabali (fkn. 0912345678).", ti: "በጃኹም ብ09 ወይ 07 ዝጅምር 10 ኣሃዛት ዘለዎ ቁጽሪ ተለፎንኩም ውሰኹ (ለምሳሌ፡ 0912345678)።" },
  "Please add your 10-digit phone number (starting with 09 or 07) or a valid email address.": { so: "Fadlan ku dar lambarkaaga taleefanka ee 10-ka lambar ah (oo ku bilaabma 09 ama 07) ama iimayl sax ah.", om: "Maaloo lakkoobsa bilbilaa kee 10 (kan 09 yookiin 07 jalqabu) yookiin iimeelii sirrii dabali.", ti: "በጃኹም ብ09 ወይ 07 ዝጅምር 10 ኣሃዛት ዘለዎ ቁጽሪ ተለፎንኩም ወይ ቅኑዕ ኢሜይል ውሰኹ።" },
  "Please enter a valid email address in an appropriate format (e.g. name@example.com).": { so: "Fadlan geli iimayl sax ah oo qaab ku habboon (tusaale name@example.com).", om: "Maaloo iimeelii sirrii haala madaalii dabali (fkn. name@example.com).", ti: "በጃኹም ቅኑዕ ኢሜይል ብዝምልከት ቅርጺ ኣእትዉ (ለምሳሌ፡ name@example.com)።" },
  "Phone number cannot contain letters. Please enter a 10-digit number starting with 09 or 07.": { so: "Lambarka taleefanku ma yeelan karo xarfo. Fadlan geli lambar 10 lambar ah oo ku bilaabma 09 ama 07.", om: "Lakkoobsi bilbilaa qubee qabaachuu hin dandaʼu. Maaloo lakkoobsa 10 kan 09 yookiin 07 jalqabu galchi.", ti: "ቁጽሪ ተለፎን ፊደላት ክሓዝ ኣይኽእልን። በጃኹም ብ09 ወይ 07 ዝጅምር 10 ኣሃዛት ዘለዎ ቁጽሪ ኣእትዉ።" },
  "Phone number must be exactly 10 digits starting with 09 or 07 (e.g. 0912345678 or 0712345678).": { so: "Lambarka taleefanku waa inuu ahaadaa sax 10 lambar oo ku bilaabma 09 ama 07 (tusaale 0912345678 ama 0712345678).", om: "Lakkoobsi bilbilaa sirritti 10 qabaachuu qaba kan 09 yookiin 07 jalqabu (fkn. 0912345678 yookiin 0712345678).", ti: "ቁጽሪ ተለፎን ብትኽክል 10 ኣሃዛት ክኸውን ኣለዎ ብ09 ወይ 07 ዝጅምር (ለምሳሌ፡ 0912345678 ወይ 0712345678)።" },
  "Please enter a valid Kebele ID format, like 12345/AA or KEB-1234 (or leave blank to skip).": { so: "Fadlan geli qaab sax ah oo Aqoonsiga Kebele ah, sida 12345/AA ama KEB-1234 (ama bannaanka ka tag si aad uga boodo).", om: "Maaloo haala sirrii Eenyummaa Kebele, akka 12345/AA yookiin KEB-1234 galchi (yookiin duwwaa dhiisi).", ti: "በጃኹም ቅኑዕ ቅርጸት መንነት ቀበሌ ኣእትዉ፣ ከም 12345/AA ወይ KEB-1234 (ወይ ንምዝላል ባዶ ግደፎ)።" },
  "Please enter a valid passport number, like EP1234567 (or leave blank to skip).": { so: "Fadlan geli lambar baasaboor oo sax ah, sida EP1234567 (ama bannaanka ka tag si aad uga boodo).", om: "Maaloo lakkoobsa paaspoortii sirrii, akka EP1234567 galchi (yookiin duwwaa dhiisi).", ti: "በጃኹም ቅኑዕ ቁጽሪ ፓስፖርት ኣእትዉ፣ ከም EP1234567 (ወይ ንምዝላል ባዶ ግደፎ)።" },
  "Please enter a valid Refugee ID format, like ETH-12345 (or leave blank to skip).": { so: "Fadlan geli qaab sax ah oo Aqoonsiga Qaxootiga ah, sida ETH-12345 (ama bannaanka ka tag si aad uga boodo).", om: "Maaloo haala sirrii Eenyummaa Baqataa, akka ETH-12345 galchi (yookiin duwwaa dhiisi).", ti: "በጃኹም ቅኑዕ ቅርጸት መንነት ስደተኛ ኣእትዉ፣ ከም ETH-12345 (ወይ ንምዝላል ባዶ ግደፎ)።" },
  "Please enter a valid document number, at least 4 characters (or leave blank to skip).": { so: "Fadlan geli lambar dukumeenti oo sax ah, ugu yaraan 4 xaraf (ama bannaanka ka tag si aad uga boodo).", om: "Maaloo lakkoobsa sanadaa sirrii, xiqqaa qubee 4 galchi (yookiin duwwaa dhiisi).", ti: "በጃኹም ቅኑዕ ቁጽሪ ሰነድ ኣእትዉ፣ እንተወሓደ 4 ፊደላት (ወይ ንምዝላል ባዶ ግደፎ)።" },
  "Restored your draft answers": { so: "Jawaabahaaga qabyada ah ayaa la soo celiyay", om: "Deebiiwwan kee qophaaʼaa deebiʼaniiru", ti: "ረቂቅ መልስኹም ተመልሷል" },
  "Start over": { so: "Dib u bilow", om: "Irra jalqabi", ti: "ኣዲስ ጀምር" },
  "Speech recognition is not supported in this browser.": { so: "Aqoonsiga hadalka biraawsarkan lama taageero.", om: "Beekumsa dubbachuu biraawsarii kana keessatti hin deeggaramu.", ti: "ምልላይ ድምጺ ኣብዚ ብራውዘር ኣይድገፍን።" },
  "Microphone access was denied. Please allow microphone permissions or type manually.": { so: "Gelitaanka makarafoonka waa la diiday. Fadlan oggolow oggolaanshaha makarafoonka ama gacanta ku qor.", om: "Hayyamni maaykiroofoonii haalameera. Maaloo hayyamni maaykiroofoonii kenni yookiin harkaan barreessi.", ti: "መእተዊ ማይክሮፎን ተነጺጉ እዩ። በጃኹም ፍቓድ ማይክሮፎን ሃቡ ወይ ብኢድ ጸሓፉ።" },
  "No speech was detected. Please try speaking again.": { so: "Hadal lama ogaan. Fadlan isku day inaad mar kale hadasho.", om: "Dubbachuun hin beekamne. Maaloo irra deebii dubbachuu yaali.", ti: "ድምጺ ኣይተረኽበን። በጃኹም እንደገና ተዛረብ ፈትን።" },
  "This language is not supported by your speech engine.": { so: "Luqaddan matoorka hadalkaaga lama taageero.", om: "Afaan kun injinii dubbachuu keetii hin deeggaramu.", ti: "እዚ ቋንቋ ብሞተር ድምጽኹም ኣይድገፍን።" },
  "Page {n}": { so: "Bogga {n}", om: "Fuula {n}", ti: "ገጽ {n}" },
  "Step {n}": { so: "Tallaabada {n}", om: "Tarkaanfii {n}", ti: "ደረጃ {n}" },
  "Step {step} of {total}": { so: "Tallaabada {step} ee {total}", om: "Tarkaanfii {step} keessaa {total}", ti: "ደረጃ {step} ካብ {total}" },
  "Welcome, {name}!": { so: "Ku soo dhawoow, {name}!", om: "Baga dhuftan, {name}!", ti: "እንኳዕ ደሓን መጻእኩም፣ {name}!" },
  "Accommodations provided:": { so: "Taageerooyinka la bixiyay:", om: "Deeggarsa kennaman:", ti: "ዝተዋህቡ ምቾታት:" },
  "Showing <strong>{a}–{b}</strong> of <strong>{total}</strong> accessible positions (Page {page} of {pages})": { so: "Waxaa la tusayaa <strong>{a}–{b}</strong> oo ka mid ah <strong>{total}</strong> boosas la heli karo (Bogga {page} ee {pages})", om: "<strong>{total}</strong> iddoowwan argamtuu keessaa <strong>{a}–{b}</strong> agarsiisaa jira (Fuula {page} kan {pages})", ti: "ካብ <strong>{total}</strong> ተደራሺ ስልጣናት <strong>{a}–{b}</strong> ይርአ ኣሎ (ገጽ {page} ካብ {pages})" },
  "<strong>{total}</strong> accessible positions match your selection": { so: "<strong>{total}</strong> boosas la heli karo ayaa ku habboon xulashadaada", om: "<strong>{total}</strong> iddoowwan argamtuu filannoo keetiif madaʼan", ti: "<strong>{total}</strong> ተደራሺ ስልጣናት ምስ ምርጫኹም ይሰማምዑ" }
};

export function baseLang(lang) {
  return String(lang || 'en').toLowerCase().split(/[-_]/)[0];
}

export function pickLang(en, am, lang) {
  const base = baseLang(lang);
  if (base === 'am') return am;
  if (base === 'so' || base === 'om' || base === 'ti') {
    const entry = CONTENT_TRANSLATIONS[en];
    if (entry && entry[base]) return entry[base];
  }
  return en;
}

// Translate an English-only string (no Amharic arm exists at the
// call site). Falls back to the English text when untranslated.
export function translateContent(text, lang) {
  const base = baseLang(lang);
  if (base === 'so' || base === 'om' || base === 'ti') {
    const entry = CONTENT_TRANSLATIONS[text];
    if (entry && entry[base]) return entry[base];
  }
  return text;
}

// Parse a language-setting value ("en_standard", "am-simple", ...).
// Returns one of en/am/so/om/ti, defaulting to en.
export function langFromSetting(value) {
  const base = String(value || '').toLowerCase().split(/[_-]/)[0];
  if (base === 'am' || base === 'so' || base === 'om' || base === 'ti' || base === 'en') return base;
  return 'en';
}

// Display name of a stored language code (profile view).
export function languageDisplayName(code) {
  const base = baseLang(code);
  if (base === 'am') return 'አማርኛ (Amharic)';
  if (base === 'so') return 'Af-Soomaali (Somali)';
  if (base === 'om') return 'Afaan Oromoo (Oromo)';
  if (base === 'ti') return 'ትግርኛ (Tigrinya)';
  return 'English';
}

export function fillPattern(pattern, values) {
  let out = String(pattern);
  Object.keys(values).forEach(function (key) {
    out = out.split('{' + key + '}').join(String(values[key]));
  });
  return out;
}
