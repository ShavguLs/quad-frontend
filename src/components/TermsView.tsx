import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ScrollText,
  Shield,
  ShoppingBag,
  BookOpen,
  User,
  Mail,
  ChevronRight,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Percent,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  number: string;
}

const SECTIONS: Section[] = [
  { id: 'gamoyeneba',  label: 'გამოყენების წესები',       icon: <ScrollText className="w-4 h-4" />,  number: '01' },
  { id: 'privatesoba', label: 'კონფიდენციალობა',           icon: <Shield className="w-4 h-4" />,      number: '02' },
  { id: 'gayidva',     label: 'გაყიდვის პირობები',         icon: <ShoppingBag className="w-4 h-4" />, number: '03' },
  { id: 'avtoroba',    label: 'ავტორის პირობები',           icon: <BookOpen className="w-4 h-4" />,    number: '04' },
  { id: 'angarishi',   label: 'ანგარიშის წესები',           icon: <User className="w-4 h-4" />,        number: '05' },
  { id: 'kontakti',    label: 'საკონტაქტო ინფორმაცია',     icon: <Mail className="w-4 h-4" />,        number: '06' },
];

// --- Reusable content primitives ---

const SubHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#FFFF2E] pt-2 pb-1 border-b border-[#FFFF2E]/20 mb-3">
    {children}
  </h3>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-gray-400 text-[13px] font-bold leading-relaxed normal-case tracking-normal">
    {children}
  </p>
);

const BulletList: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="space-y-2 mt-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3 text-gray-400 text-[13px] font-bold leading-relaxed normal-case tracking-normal">
        <span className="mt-1.5 w-1.5 h-1.5 bg-[#FFFF2E] flex-shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const Callout: React.FC<{ type?: 'warn' | 'ok' | 'no' | 'info'; children: React.ReactNode }> = ({
  type = 'info',
  children,
}) => {
  const styles = {
    warn: { border: 'border-yellow-500/30 bg-yellow-500/5', icon: <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" /> },
    ok:   { border: 'border-green-500/20 bg-green-500/5',   icon: <CheckCircle   className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> },
    no:   { border: 'border-red-500/20 bg-red-500/5',       icon: <XCircle       className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> },
    info: { border: 'border-white/10 bg-white/3',           icon: <Info          className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> },
  };
  const s = styles[type];
  return (
    <div className={`border-2 ${s.border} p-4 flex gap-3`}>
      {s.icon}
      <p className="text-[13px] font-bold leading-relaxed normal-case tracking-normal text-gray-400">{children}</p>
    </div>
  );
};

const SplitStat: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`flex-1 border-2 ${accent ? 'border-[#FFFF2E] bg-[#FFFF2E]/5' : 'border-white/10'} p-4 text-center`}>
    <div className={`text-3xl font-black ${accent ? 'text-[#FFFF2E]' : 'text-white'}`}>{value}</div>
    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-1">{label}</div>
  </div>
);

// --- Section wrapper ---

interface PolicySectionProps {
  id: string;
  number: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const PolicySection: React.FC<PolicySectionProps> = ({ id, number, icon, title, children }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.4 }}
    className="bg-zinc-950 border-2 border-white/5 hover:border-white/10 transition-colors scroll-mt-32"
  >
    <div className="border-b-2 border-white/5 px-8 py-6 flex items-center gap-6">
      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FFFF2E]">{number}</span>
      <div className="flex items-center gap-3 flex-1">
        <span className="text-[#FFFF2E]">{icon}</span>
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">{title}</h2>
      </div>
    </div>
    <div className="px-8 py-8 space-y-6">
      {children}
    </div>
  </motion.section>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export const TermsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 md:pt-32 pb-24 selection:bg-[#FFFF2E] selection:text-black">
      <div className="container mx-auto px-4 md:px-6">

        {/* Back button */}
        <Link
          to="/"
          className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] hover:text-[#FFFF2E] transition-colors mb-16"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
          მთავარი
        </Link>

        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FFFF2E]">
            QUADUNI.COM — v1.0 — 2026
          </span>
          <h1 className="mt-4 text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.82]">
            წესები<br />
            <span className="text-[#FFFF2E]">&amp;</span> პოლიტიკა
          </h1>
          <div className="mt-8 flex items-center gap-6">
            <div className="h-[2px] w-24 bg-[#FFFF2E]" />
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest max-w-sm">
              გთხოვთ, ყურადღებით გაეცნოთ პლატფორმის გამოყენების პირობებსა და წესებს.
            </p>
          </div>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ── Sidebar TOC ── */}
          <aside className="lg:col-span-4">
            <div className="sticky top-32">
              <div className="border-4 border-white shadow-[10px_10px_0px_0px_rgba(255,255,46,1)]">
                <div className="bg-[#FFFF2E] px-6 py-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">შინაარსი</span>
                </div>
                <ul className="divide-y divide-white/5">
                  {SECTIONS.map(({ id, label, number, icon }) => {
                    const isActive = activeSection === id;
                    return (
                      <li key={id}>
                        <button
                          onClick={() => scrollTo(id)}
                          className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-all group ${
                            isActive ? 'bg-[#FFFF2E] text-black' : 'hover:bg-white/5 text-white'
                          }`}
                        >
                          <span className={`text-[10px] font-black tracking-widest ${isActive ? 'text-black' : 'text-[#FFFF2E]'}`}>
                            {number}
                          </span>
                          <span className={isActive ? 'text-black' : 'text-[#FFFF2E]'}>{icon}</span>
                          <span className="text-xs font-black uppercase tracking-wider flex-1 leading-tight">{label}</span>
                          <ChevronRight
                            className={`w-3 h-3 transition-transform ${
                              isActive ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-6 px-6 py-4 border-2 border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">ბოლო განახლება</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFFF2E] mt-1">მარტი 2026</p>
              </div>
            </div>
          </aside>

          {/* ── Content ── */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* ── 01 გამოყენების წესები ── */}
            <PolicySection id="gamoyeneba" number="01" icon={<ScrollText className="w-4 h-4" />} title="გამოყენების წესები">
              <div>
                <SubHead>პლატფორმის დანიშნულება</SubHead>
                <Body>
                  Quaduni.com არის ქართული ციფრული წიგნების პლატფორმა, რომელიც აკავშირებს ავტორებსა და მკითხველებს.
                  ჩვენ ვუზრუნველყოფთ წიგნების განთავსების, გაყიდვისა და კითხვის მოხერხებულ ინტერფეისს ერთ სივრცეში.
                </Body>
              </div>

              <div>
                <SubHead>ვის შეუძლია პლატფორმის გამოყენება</SubHead>
                <BulletList items={[
                  'პლატფორმით სარგებლობა შეუძლია 16 წელს ზემოთ ასაკის ნებისმიერ პირს.',
                  'გამოყენებით თქვენ ადასტურებთ, რომ ამ წესებს ეთანხმებით სრულად.',
                  'ადმინისტრაცია იტოვებს უფლებას, განახორციელოს ქცევის წესების დამრღვევი ანგარიშის ბლოკირება.',
                ]} />
              </div>

              <div>
                <SubHead>აკრძალული ქმედებები</SubHead>
                <BulletList items={[
                  'სხვა მომხმარებლის ანგარიშის არასანქცირებული გამოყენება ან მასზე არაავტორიზებული წვდომის მცდელობა.',
                  'ავტომატური სკრიპტების, ბოტების ან scrapers-ის გამოყენება კონტენტის მოსაგროვებლად.',
                  'ისეთი კონტენტის ატვირთვა ან გავრცელება, რომელიც არღვევს სხვა პირის საავტორო უფლებებს.',
                  'პლატფორმის ინფრასტრუქტურის ან სხვა მომხმარებლის ანგარიშის დაზიანების ან გატეხვის მცდელობა.',
                  'ყალბი ინფორმაციის, სპამის ან შეურაცხმყოფელი კონტენტის გავრცელება.',
                ]} />
              </div>

              <div>
                <SubHead>წესების ცვლილება</SubHead>
                <Body>
                  ადმინისტრაცია იტოვებს უფლებას, ნებისმიერ დროს განაახლოს ეს წესები ვებ-გვერდზე შესაბამისი ცვლილების განთავსებით.
                  განახლებული წესები ამოქმედდება მათი გამოქვეყნების მომენტიდან. პლატფორმის შემდგომი გამოყენება
                  ნიშნავს ახალ პირობებთან თქვენს თანხმობას.
                </Body>
              </div>

              <Callout type="info">
                ამ წესებთან ან პოლიტიკასთან დაკავშირებული ნებისმიერი კითხვისთვის მოგვწერეთ:
                lukamirtskhulava28@gmail.com
              </Callout>
            </PolicySection>

            {/* ── 02 კონფიდენციალობა ── */}
            <PolicySection id="privatesoba" number="02" icon={<Shield className="w-4 h-4" />} title="კონფიდენციალობის პოლიტიკა">
              <Body>
                ჩვენი პრიორიტეტია, რომ Quaduni.com-ზე თქვენი ყოფნა იყოს უსაფრთხო. ჩვენ ვაგროვებთ მხოლოდ
                იმ მონაცემებს, რაც აუცილებელია პლატფორმის მუშაობისთვის.
              </Body>

              <div>
                <SubHead>რა ინფორმაციას ვამუშავებთ</SubHead>
                <div className="space-y-3">
                  <div className="border-l-2 border-[#FFFF2E]/40 pl-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#FFFF2E] mb-1">ავტორებისთვის</p>
                    <Body>სახელი, გვარი, ელექტრონული ფოსტა, ტელეფონის ნომერი და საბანკო რეკვიზიტები (IBAN),
                    რათა შევძლოთ თქვენი კუთვნილი ჰონორარის ჩარიცხვა.</Body>
                  </div>
                  <div className="border-l-2 border-white/20 pl-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">მკითხველებისთვის</p>
                    <Body>სახელი, გვარი, ელ-ფოსტა და შეძენილი წიგნების ისტორია, რათა ყოველთვის გქონდეთ
                    წვდომა თქვენს საკუთრებაზე.</Body>
                  </div>
                  <div className="border-l-2 border-white/20 pl-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">ტექნიკური მონაცემები</p>
                    <Body>საიტის გამართული მუშაობისთვის ვიყენებთ Cookies-ფაილებს და IP მისამართების აღრიცხვას,
                    რაც გვეხმარება უსაფრთხოების კონტროლსა და საიტის ოპტიმიზაციაში.</Body>
                  </div>
                </div>
              </div>

              <div>
                <SubHead>რას არ ვინახავთ</SubHead>
                <Callout type="ok">
                  ჩვენთვის მნიშვნელოვანია თქვენი ფინანსური უსაფრთხოება, ამიტომ ჩვენ არ მოვითხოვთ და არ
                  ვინახავთ პირად ნომერს, ბარათის CVV კოდს, ვადებს ან სხვა სენსიტიურ ფინანსურ მონაცემებს.
                  გადახდისას მონაცემები მუშავდება მხოლოდ დაცული საბანკო სისტემების მიერ.
                </Callout>
              </div>

              <div>
                <SubHead>რაში ვიყენებთ თქვენს მონაცემებს</SubHead>
                <BulletList items={[
                  'ავტორებთან ფინანსური ანგარიშსწორებისთვის — ჰონორარის ჩარიცხვა IBAN-ზე.',
                  'მკითხველებისთვის შეძენილ წიგნებზე წვდომის უზრუნველსაყოფად.',
                  'ტექნიკური მხარდაჭერისთვის და პლატფორმის სიახლეების გასაზიარებლად.',
                ]} />
              </div>

              <div>
                <SubHead>მონაცემთა დაცვა და გაზიარება</SubHead>
                <Body>
                  ჩვენ არ ვყიდით და არ გადავცემთ თქვენს მონაცემებს მესამე პირებს სარეკლამო მიზნებისთვის.
                  ინფორმაცია შეიძლება გაზიარდეს მხოლოდ კანონით განსაზღვრულ შემთხვევებში ან გადახდის
                  ოპერატორებთან — ტრანზაქციის დასასრულებლად.
                </Body>
              </div>

              <div>
                <SubHead>თქვენი უფლებები</SubHead>
                <BulletList items={[
                  'გაეცნოთ, რა მონაცემები გაქვთ ჩვენთან შენახული — მოგვწერეთ და ჩვენ გამოგიგზავნით მათ.',
                  'მოითხოვოთ მონაცემების კორექტირება, თუ ისინი არასწორია.',
                  'მოითხოვოთ ანგარიშისა და შენახული მონაცემების სრული წაშლა — ამ შემთხვევაში წვდომა შეძენილ წიგნებზეც შეიზღუდება.',
                  'უარი თქვათ მარკეტინგული ელ-ფოსტის მიღებაზე ნებისმიერ დროს.',
                ]} />
              </div>

              <div>
                <SubHead>მონაცემების შენახვის ვადა</SubHead>
                <Body>
                  ვინახავთ მონაცემებს ანგარიშის არსებობის განმავლობაში, ასევე კანონმდებლობით განსაზღვრული
                  ვადებით ფინანსური ოპერაციების შენახვასთან დაკავშირებით (5 წელი). ანგარიშის
                  წაშლის შემდეგ პერსონალური მონაცემები ამოიშლება 30 სამუშაო დღის ვადაში.
                </Body>
              </div>
            </PolicySection>

            {/* ── 03 გაყიდვის პირობები ── */}
            <PolicySection id="gayidva" number="03" icon={<ShoppingBag className="w-4 h-4" />} title="გაყიდვის პირობები">
              <div>
                <SubHead>წვდომის პერიოდი</SubHead>
                <Body>
                  წიგნის შეძენისას თქვენ ყიდულობთ კითხვის უფლებას <strong className="text-white">6 კალენდარული თვის</strong> განმავლობაში
                  შეძენის თარიღიდან. ვადის გასვლის შემდეგ წვდომა ავტომატურად იზღუდება. ვადის გასვლამდე
                  შესაძლებელია წვდომის განახლება ახალი შეძენით.
                </Body>
              </div>

              <div>
                <SubHead>კოპირებისა და გავრცელების აკრძალვა</SubHead>
                <Callout type="warn">
                  წიგნების გადმოწერა (Download), სქრინშოტების გადაღება ან ტექსტის კოპირება მკაცრად
                  აკრძალულია. კითხვა ხდება მხოლოდ საიტის შიდა სისტემაში. ამ წესის დარღვევა გამოიწვევს
                  ანგარიშის სამუდამო ბლოკირებას.
                </Callout>
              </div>

              <div>
                <SubHead>გადახდის მეთოდები</SubHead>
                <BulletList items={[
                  'გადახდა ხდება Quaduni ვირტუალური საფულის მეშვეობით.',
                  'საფულის შევსება შეიძლება საბანკო ბარათით ან გადარიცხვით.',
                  'ყველა ფასი მითითებულია ლარში (₾) და მოიცავს ყველა გადასახადს.',
                ]} />
              </div>

              <div>
                <SubHead>თანხის დაბრუნება (Refund Policy)</SubHead>
                <Body>
                  ვინაიდან პროდუქტი ციფრულია და მასზე წვდომა ხდება მომენტალურად, გადახდილი თანხა
                  უკან არ ბრუნდება.
                </Body>
                <div className="mt-3">
                  <Callout type="ok">
                    გამონაკლისია მხოლოდ ის შემთხვევა, თუ ფაილი ტექნიკურად დაზიანებულია და
                    მისი წაკითხვა შეუძლებელია. ამ შემთხვევაში გთხოვთ, დაგვიკავშირდეთ 7 სამუშაო
                    დღის განმავლობაში შეძენის თარიღიდან.
                  </Callout>
                </div>
              </div>

              <div>
                <SubHead>ადმინისტრაციის პასუხისმგებლობა</SubHead>
                <Body>
                  ადმინისტრაცია არ აგებს პასუხს საიტის დროებით შეფერხებაზე, რომელიც გამოწვეულია
                  ტექნიკური პროფილაქტიკით, ინტერნეტ-პროვაიდერის ხარვეზით ან ფორს-მაჟორული
                  გარემოებებით. ასეთ შემთხვევაში წვდომის ვადა შეიძლება გაგრძელდეს ინდივიდუალური
                  განხილვის საფუძველზე.
                </Body>
              </div>
            </PolicySection>

            {/* ── 04 ავტორის პირობები ── */}
            <PolicySection id="avtoroba" number="04" icon={<BookOpen className="w-4 h-4" />} title="ავტორის პირობები">
              <div>
                <SubHead>შემოსავლის განაწილება</SubHead>
                <div className="flex gap-4 mt-2">
                  <SplitStat label="ავტორი" value="80%" accent />
                  <SplitStat label="პლატფორმა" value="20%" />
                </div>
                <Body>
                  <span className="block mt-4">
                    თითოეული გაყიდული ეგზემპლარიდან ავტორი იღებს თანხის 80%-ს, ხოლო
                    პლატფორმის საკომისიო შეადგენს 20%-ს — ეს მოიცავს გადახდის დამუშავებას,
                    ჰოსტინგს, ტექნიკურ მხარდაჭერასა და მარკეტინგს.
                  </span>
                </Body>
              </div>

              <div>
                <SubHead>ჰონორარის გატანა</SubHead>
                <BulletList items={[
                  'თანხა არ ირიცხება ავტომატურად — ავტორი უნდა მოგვმართოს გატანის მოთხოვნით.',
                  'გატანის მოთხოვნა შეიძლება გამოიგზავნოს ელ-ფოსტაზე ან ტელეფონით.',
                  'გადარიცხვა განხორციელდება IBAN-ზე, მოთხოვნიდან 3-5 სამუშაო დღეში.',
                  'მინიმალური გასატანი თანხა: ₾10.',
                ]} />
              </div>

              <div>
                <SubHead>საავტორო უფლებები</SubHead>
                <Body>
                  წიგნის ატვირთვით ავტორი ადასტურებს, რომ კონტენტი სრულად მისია და მესამე
                  პირის საავტორო უფლებებს არ არღვევს. Quaduni.com-ს მხოლოდ მის პლატფორმაზე
                  გავრცელების არაექსკლუზიური ლიცენზია გადაეცემა — ავტორი ინარჩუნებს ყველა
                  სხვა უფლებას.
                </Body>
              </div>

              <Callout type="warn">
                Quaduni.com არ იღებს პასუხისმგებლობას მესამე პირის საავტორო უფლებების
                დარღვევაზე ავტორის მიერ. ასეთ საჩივარს ადმინისტრაცია დაუყოვნებლივ განიხილავს
                და პასუხისმგებლობა მთლიანად ეკისრება კონტენტის ავტორს.
              </Callout>

              <div>
                <SubHead>გადასახადები</SubHead>
                <Body>
                  მიღებული შემოსავლის დეკლარირებაზე და სახელმწიფო გადასახადებზე სრული
                  პასუხისმგებლობა ეკისრება თავად ავტორს. Quaduni.com არ ახდენს საგადასახადო
                  ვალდებულებების შესრულებას ავტორის სახელით.
                </Body>
              </div>

              <div>
                <SubHead>კონტენტის მოხსნა</SubHead>
                <Body>
                  ავტორს შეუძლია ნებისმიერ დროს მოითხოვოს წიგნის გაყიდვიდან ამოღება. ამ
                  შემთხვევაში უკვე შეძენილი მკითხველები ინარჩუნებენ წვდომას დარჩენილი
                  6-თვიანი პერიოდის განმავლობაში.
                </Body>
              </div>
            </PolicySection>

            {/* ── 05 ანგარიშის წესები ── */}
            <PolicySection id="angarishi" number="05" icon={<User className="w-4 h-4" />} title="ანგარიშის წესები">
              <div>
                <SubHead>ანგარიშის პირადი ხასიათი</SubHead>
                <Body>
                  Quaduni.com-ზე თქვენი ანგარიში პერსონალურია. ანგარიშის სხვა პირისთვის
                  გადაცემა, გაზიარება ან გასხვისება კატეგორიულად აკრძალულია.
                </Body>
              </div>

              <div>
                <SubHead>ანგარიშის დაბლოკვა</SubHead>
                <Body>პროფილის ბლოკირება მოხდება შემდეგ შემთხვევებში:</Body>
                <BulletList items={[
                  'სხვა მომხმარებლის მასალის არასანქცირებული კოპირება ან გავრცელება.',
                  'ანგარიშის სხვა პირისთვის გადაცემა ან წიგნებზე ჯგუფური წვდომის მოწყობა.',
                  'თაღლითური, შეურაცხმყოფელი ან კანონსაწინააღმდეგო ქმედება პლატფორმაზე.',
                  'ადმინისტრაციის მიერ გაგზავნილ გაფრთხილებებზე განმეორებითი სავარჯიშო.',
                ]} />
              </div>

              <div>
                <SubHead>ანგარიშის წაშლა მომხმარებლის მიერ</SubHead>
                <Body>
                  ნებისმიერ დროს შეგიძლიათ მოითხოვოთ ანგარიშის სრული წაშლა ელ-ფოსტაზე
                  მოთხოვნის გამოგზავნით. ანგარიშის წაშლა გამოიწვევს შეძენილ წიგნებზე
                  წვდომის შეწყვეტას — ეს პროცესი შეუქცევადია.
                </Body>
              </div>

              <Callout type="no">
                ბლოკირებული ანგარიშის შემთხვევაში შეძენილ კონტენტზე წვდომა ავტომატურად
                იკეტება. ბლოკის მიმართ გასაჩივრება შეიძლება ელ-ფოსტით 14 სამუშაო დღის
                განმავლობაში ბლოკირების მომენტიდან.
              </Callout>

              <div>
                <SubHead>პაროლისა და უსაფრთხოების ვალდებულება</SubHead>
                <Body>
                  მომხმარებელი პასუხისმგებელია ანგარიშზე მისი პაროლის კონფიდენციალურობის
                  შენარჩუნებაზე. არასანქცირებული წვდომის ფაქტის აღმოჩენისთანავე დაუყოვნებლივ
                  შეგვატყობინეთ ელ-ფოსტაზე ან ტელეფონით.
                </Body>
              </div>
            </PolicySection>

            {/* ── 06 საკონტაქტო ── */}
            <PolicySection id="kontakti" number="06" icon={<Mail className="w-4 h-4" />} title="საკონტაქტო ინფორმაცია">
              <Body>
                კითხვების, ჰონორარის გატანის მოთხოვნის, ანგარიშის პრობლემის ან ნებისმიერი
                სხვა საკითხის შემთხვევაში, მოგვწერეთ ან დაგვირეკეთ. ვცდილობთ ყველა
                მიმართვას ვუპასუხოთ 1-2 სამუშაო დღეში.
              </Body>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <a
                  href="mailto:lukamirtskhulava28@gmail.com"
                  className="group border-2 border-white/10 hover:border-[#FFFF2E] p-5 flex items-start gap-4 transition-all"
                >
                  <Mail className="w-5 h-5 text-[#FFFF2E] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">ელ-ფოსტა</p>
                    <p className="text-sm font-black normal-case group-hover:text-[#FFFF2E] transition-colors break-all">
                      lukamirtskhulava28@gmail.com
                    </p>
                  </div>
                </a>

                <a
                  href="tel:+995591286699"
                  className="group border-2 border-white/10 hover:border-[#FFFF2E] p-5 flex items-start gap-4 transition-all"
                >
                  <Phone className="w-5 h-5 text-[#FFFF2E] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">ტელეფონი</p>
                    <p className="text-sm font-black normal-case group-hover:text-[#FFFF2E] transition-colors">
                      +995 591 28 66 99
                    </p>
                  </div>
                </a>
              </div>

              <div>
                <SubHead>დამფუძნებლები</SubHead>
                <div className="flex flex-col sm:flex-row gap-3">
                  {['ლუკა მირცხულავა', 'ზურაბ ჯორბენაძე'].map((name) => (
                    <div key={name} className="flex items-center gap-3 border-2 border-white/5 px-5 py-3">
                      <Percent className="w-3 h-3 text-[#FFFF2E]" />
                      <span className="text-sm font-black normal-case">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SubHead>სამუშაო საათები</SubHead>
                <Body>ორშაბათი – შაბათი, 09:00 – 20:00 (საქართველოს დრო)</Body>
              </div>
            </PolicySection>

            {/* Bottom notice */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border-t-4 border-[#FFFF2E] pt-8 mt-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                © 2026 quaduni.com — ყველა უფლება დაცულია.
                ამ გვერდზე წარმოდგენილი ინფორმაცია შეიძლება შეიცვალოს წინასწარი გაფრთხილების გარეშე.
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};
