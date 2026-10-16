import * as React from "react";
import {
    ScrollableTabs,
    getPanelId,
    getTabId,
    useScrollSpy,
} from "smooth-tabs";
import type { TabItem } from "smooth-tabs";
import conversionIcon from "./icons/conversionIcon.svg";
import documentIcon from "./icons/DocumentIcon.svg";
import fileChangeIcon from "./icons/fileChangeIcon.svg";
import playgroundIcon from "./icons/playground.svg";
import portalIcon from "./icons/portalIcon.svg";
import reportIcon from "./icons/ReportIcon.svg";
import revenueIcon from "./icons/revinueIcon.svg";
import segmentIcon from "./icons/segmentIcon.svg";
import storiesIcon from "./icons/storiesIcon.svg";
import { Hero, NPM, REPO, SiteNav } from "./Header";

/** Renders an SVG file in `currentColor`, so icons follow the tab's active color. */
function Icon({ src, size = 18 }: { src: string; size?: number }) {
    return (
        <span
            className="icon"
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                // Quoted: Vite inlines small SVGs as data URLs.
                WebkitMaskImage: `url("${src}")`,
                maskImage: `url("${src}")`,
            }}
        />
    );
}

// ---- Showcase -----------------------------------------------------------------

interface Area {
    value: string;
    label: string;
    icon: string;
    badge?: TabItem["badge"];
    disabled?: boolean;
    title: string;
    text: string;
    stats: Array<[string, string]>;
}

const AREAS: Area[] = [
    {
        value: "reports",
        label: "Reports",
        icon: reportIcon,
        title: "Interactive reports",
        text: "Build dashboards from live data and share them with your team.",
        stats: [
            ["Dashboards", "48"],
            ["Viewers", "1,204"],
            ["Avg. load", "0.8s"],
        ],
    },
    {
        value: "playground",
        label: "Playground",
        icon: playgroundIcon,
        title: "Query playground",
        text: "Try out queries against a sandbox copy of production.",
        stats: [
            ["Saved queries", "312"],
            ["Runs today", "86"],
            ["Sandbox size", "2.1 GB"],
        ],
    },
    {
        value: "changes",
        label: "File changes",
        icon: fileChangeIcon,
        badge: { value: 22, color: "#e11d48" },
        title: "File changes",
        text: "22 files changed since your last visit. Review them before the next sync.",
        stats: [
            ["Added", "+1,840"],
            ["Removed", "−392"],
            ["Reviewers", "4"],
        ],
    },
    {
        value: "segments",
        label: "Segmentation",
        icon: segmentIcon,
        title: "Audience segments",
        text: "Group customers by behaviour and target each segment separately.",
        stats: [
            ["Segments", "27"],
            ["Largest", "38%"],
            ["Updated", "2h ago"],
        ],
    },
    {
        value: "docs",
        label: "Documentation",
        icon: documentIcon,
        title: "Documentation",
        text: "Guides, API reference and changelogs, all in one place.",
        stats: [
            ["Pages", "214"],
            ["Guides", "36"],
            ["Last edit", "Today"],
        ],
    },
    {
        value: "stories",
        label: "Customer stories",
        icon: storiesIcon,
        title: "Customer stories",
        text: "How teams use the platform, in their own words.",
        stats: [
            ["Stories", "19"],
            ["Industries", "8"],
            ["Avg. ROI", "3.4×"],
        ],
    },
    {
        value: "analytics",
        label: "Group analytics",
        icon: revenueIcon,
        badge: 5,
        title: "Group analytics",
        text: "Compare revenue and retention across accounts and regions.",
        stats: [
            ["MRR", "$84.2k"],
            ["Retention", "92%"],
            ["New alerts", "5"],
        ],
    },
    {
        value: "conversion",
        label: "Conversion",
        icon: conversionIcon,
        title: "Conversion funnels",
        text: "See where visitors drop off and what brings them back.",
        stats: [
            ["Visitors", "58k"],
            ["Sign-ups", "4.7%"],
            ["Paid", "1.2%"],
        ],
    },
    {
        value: "portals",
        label: "Portals",
        icon: portalIcon,
        disabled: true,
        title: "Portals",
        text: "",
        stats: [],
    },
];

const AREA_TABS: TabItem[] = AREAS.map((a) => ({
    value: a.value,
    label: a.label,
    icon: <Icon src={a.icon} />,
    badge: a.badge,
    disabled: a.disabled,
}));

function Showcase() {
    const [value, setValue] = React.useState("changes");
    const area = AREAS.find((a) => a.value === value) ?? AREAS[0];
    return (
        <div className="showcase">
            <div className="showcase__bar">
                <ScrollableTabs
                    aria-label="Product areas"
                    idPrefix="area"
                    tabs={AREA_TABS}
                    value={value}
                    onChange={setValue}
                />
            </div>
            <div
                key={area.value}
                className="showcase__panel"
                role="tabpanel"
                id={getPanelId("area", area.value)}
                aria-labelledby={getTabId("area", area.value)}
            >
                <div className="panel-head">
                    <span className="tile">
                        <Icon src={area.icon} size={22} />
                    </span>
                    <div>
                        <h3>{area.title}</h3>
                        <p>{area.text}</p>
                    </div>
                </div>
                <dl className="stats">
                    {area.stats.map(([label, stat]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{stat}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}

// ---- Variants ---------------------------------------------------------------------

const SETTINGS = [
    "Profile",
    "Account",
    "Notifications",
    "Appearance",
    "Billing",
    "Security",
    "Integrations",
    "API keys",
    "Team",
    "Danger zone",
];

function VerticalCard() {
    const [value, setValue] = React.useState("Profile");
    return (
        <Card
            title="Vertical"
            text="A settings sidebar. Give it a height and the arrows appear when it overflows. Use ↑ ↓ to move."
        >
            <div className="settings">
                <ScrollableTabs
                    aria-label="Settings"
                    orientation="vertical"
                    tabs={SETTINGS.map((s) => ({ value: s, label: s }))}
                    value={value}
                    onChange={setValue}
                    style={{ height: 248 }}
                />
                <div className="settings__panel" key={value}>
                    <p className="settings__title">{value}</p>
                    <div className="field">
                        <span />
                        <i />
                    </div>
                    <div className="field">
                        <span />
                        <i />
                    </div>
                    <div className="field short">
                        <span />
                        <i />
                    </div>
                </div>
            </div>
        </Card>
    );
}

function SegmentedCard() {
    const [range, setRange] = React.useState("week");
    const [cat, setCat] = React.useState("design");
    return (
        <Card
            title="Segmented"
            text="The same component restyled with a few CSS variables. The indicator becomes the sliding pill."
        >
            <div className="stack">
                <ScrollableTabs
                    className="segmented"
                    aria-label="Date range"
                    tabs={["day", "week", "month", "quarter", "year"].map(
                        (v) => ({
                            value: v,
                            label: v[0].toUpperCase() + v.slice(1),
                        })
                    )}
                    value={range}
                    onChange={setRange}
                />
                <ScrollableTabs
                    className="segmented segmented--dark"
                    aria-label="Categories"
                    tabs={[
                        "design",
                        "engineering",
                        "marketing",
                        "sales",
                        "support",
                        "finance",
                        "legal",
                        "operations",
                    ].map((v) => ({
                        value: v,
                        label: v[0].toUpperCase() + v.slice(1),
                    }))}
                    value={cat}
                    onChange={setCat}
                />
            </div>
        </Card>
    );
}

function UnderlineCard() {
    const [value, setValue] = React.useState("inbox");
    return (
        <Card
            title="Badges & disabled tabs"
            text="Badges accept a number, any node, or a colored pill. Disabled tabs are skipped by the keyboard."
        >
            <ScrollableTabs
                className="bold"
                aria-label="Mailbox"
                tabs={[
                    {
                        value: "inbox",
                        label: "Inbox",
                        badge: { value: 12, color: "#4f46e5" },
                    },
                    { value: "starred", label: "Starred" },
                    { value: "sent", label: "Sent" },
                    { value: "drafts", label: "Drafts", badge: 3 },
                    { value: "spam", label: "Spam", disabled: true },
                ]}
                value={value}
                onChange={setValue}
            />
        </Card>
    );
}

function RtlCard() {
    return (
        <Card
            title="Right-to-left"
            text='Under dir="rtl" the scrolling, arrow keys, buttons and edge fades all flip.'
        >
            <div dir="rtl" lang="ar">
                <ScrollableTabs
                    aria-label="علامات التبويب"
                    tabs={[
                        "الرئيسية",
                        "التقارير",
                        "الإعدادات",
                        "المستخدمون",
                        "الفواتير",
                        "التكاملات",
                        "المساعدة",
                    ].map((label, i) => ({ value: String(i), label }))}
                />
            </div>
        </Card>
    );
}

function Card({
    title,
    text,
    children,
}: {
    title: string;
    text: string;
    children: React.ReactNode;
}) {
    return (
        <section className="card">
            <div className="card__stage">{children}</div>
            <div className="card__body">
                <h3>{title}</h3>
                <p>{text}</p>
            </div>
        </section>
    );
}

// ---- Scroll-spy menu -----------------------------------------------------------------

const MENU: Array<{
    id: string;
    title: string;
    dishes: Array<[string, string, string]>;
}> = [
    {
        id: "starters",
        title: "Starters",
        dishes: [
            ["Burrata", "Heirloom tomato, basil oil, sea salt", "14"],
            ["Arancini", "Saffron risotto, smoked mozzarella", "11"],
            ["Calamari", "Lemon aioli, chilli, parsley", "13"],
            ["Bruschetta", "Charred sourdough, garlic, olive oil", "9"],
        ],
    },
    {
        id: "salads",
        title: "Salads",
        dishes: [
            ["Caesar", "Gem lettuce, anchovy, parmesan crisp", "12"],
            ["Panzanella", "Bread, cucumber, red onion, capers", "11"],
        ],
    },
    {
        id: "pizza",
        title: "Wood-fired pizza",
        dishes: [
            ["Margherita", "San Marzano, fior di latte, basil", "15"],
            ["Diavola", "Spicy salami, chilli honey", "18"],
            ["Funghi", "Wild mushrooms, truffle, taleggio", "19"],
            ["Bianca", "Ricotta, garlic, rosemary, lemon", "16"],
            ["Prosciutto", "Rocket, parmesan, cured ham", "19"],
            ["Nduja", "Calabrian sausage, burrata, olives", "18"],
        ],
    },
    {
        id: "pasta",
        title: "Fresh pasta",
        dishes: [
            ["Cacio e pepe", "Tonnarelli, pecorino, black pepper", "17"],
            ["Ragù", "Pappardelle, slow-cooked beef", "21"],
            ["Vongole", "Linguine, clams, white wine", "23"],
            ["Pesto", "Trofie, basil, pine nuts, green beans", "16"],
        ],
    },
    {
        id: "grill",
        title: "From the grill",
        dishes: [
            ["Bistecca", "Dry-aged sirloin, salsa verde", "34"],
            ["Branzino", "Whole sea bass, fennel, lemon", "29"],
        ],
    },
    {
        id: "sides",
        title: "Sides",
        dishes: [
            ["Patate", "Crispy potatoes, rosemary salt", "6"],
            ["Broccolini", "Garlic, chilli, lemon", "7"],
            ["Polenta", "Soft, parmesan, butter", "6"],
        ],
    },
    {
        id: "desserts",
        title: "Desserts",
        dishes: [
            ["Tiramisu", "Espresso, mascarpone, cocoa", "9"],
            ["Panna cotta", "Vanilla, seasonal berries", "8"],
            ["Affogato", "Fior di latte gelato, espresso", "7"],
        ],
    },
    {
        id: "drinks",
        title: "Drinks",
        dishes: [
            ["Negroni", "Gin, Campari, vermouth", "13"],
            ["Spritz", "Aperol, prosecco, soda", "12"],
            ["Limonata", "House lemonade, mint", "5"],
            ["Chinotto", "Bitter Italian soda", "5"],
        ],
    },
    {
        id: "coffee",
        title: "Coffee & tea",
        dishes: [
            ["Espresso", "Single origin, Ethiopia", "3"],
            ["Cappuccino", "Whole or oat milk", "4"],
        ],
    },
];

const MENU_IDS = MENU.map((s) => s.id);

function MenuDemo() {
    const { activeId, scrollTo } = useScrollSpy(MENU_IDS, { offset: 76 });
    return (
        <div className="menu">
            <nav className="menu__bar">
                <ScrollableTabs
                    aria-label="Menu categories"
                    tabs={MENU.map((s) => ({
                        value: s.id,
                        label: s.title,
                    }))}
                    value={activeId}
                    onChange={scrollTo}
                    scrollAlign="center"
                />
            </nav>
            {MENU.map((s) => (
                <section key={s.id} id={s.id} className="menu__section">
                    <h3>{s.title}</h3>
                    <div className="dishes">
                        {s.dishes.map(([name, desc, price]) => (
                            <article key={name} className="dish">
                                <div>
                                    <h4>{name}</h4>
                                    <p>{desc}</p>
                                </div>
                                <span className="price">${price}</span>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

// ---- Page ----------------------------------------------------------------------------

export function App() {
    return (
        <>
            <SiteNav />

            <main>
                <Hero />

                <section
                    id="examples"
                    className="wrap block block--first"
                    aria-labelledby="examples-title"
                >
                    <div className="block__head">
                        <h2 id="examples-title">Live example</h2>
                        <p>
                            Overflowing tabs with icons, badges and a disabled
                            tab. Swipe, scroll or use the arrows. Click a tab,
                            then try <kbd>←</kbd> <kbd>→</kbd> <kbd>Home</kbd>{" "}
                            <kbd>End</kbd>.
                        </p>
                    </div>
                    <Showcase />
                </section>

                <section id="variants" className="wrap block">
                    <div className="block__head">
                        <h2>Styling variants</h2>
                        <p>
                            Style it with CSS variables, class names or your
                            design system. The stylesheet never touches the rest
                            of your page.
                        </p>
                    </div>
                    <div className="grid">
                        <VerticalCard />
                        <SegmentedCard />
                        <UnderlineCard />
                        <RtlCard />
                    </div>
                </section>

                <section id="spy" className="wrap block">
                    <div className="block__head">
                        <h2>Scroll-spy, built in</h2>
                        <p>
                            <code>useScrollSpy</code> highlights the section
                            you&rsquo;re reading and keeps it visible in the
                            bar. Click a category to glide there without the
                            tabs flickering on the way.
                        </p>
                    </div>
                    <pre
                        className="code-block"
                        tabIndex={0}
                        aria-label="useScrollSpy usage"
                    >
                        <code>{`const { activeId, scrollTo } = useScrollSpy(ids, { offset: 76 });

<ScrollableTabs tabs={tabs} value={activeId} onChange={scrollTo} />`}</code>
                    </pre>
                    <MenuDemo />
                </section>
            </main>

            <footer className="footer">
                <div className="wrap footer__inner">
                    <span>ISC licensed · Made by Mohsin Zia</span>
                    <span>
                        <a href={REPO}>GitHub</a> · <a href={NPM}>npm</a>
                    </span>
                </div>
            </footer>
        </>
    );
}
