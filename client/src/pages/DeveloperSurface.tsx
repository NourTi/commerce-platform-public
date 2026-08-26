import ShopShell from "@/components/ShopShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { commerceCopy } from "@/lib/commerceCopy";
import { Braces, Code2, FileJson, GitBranch, TerminalSquare } from "lucide-react";

export default function DeveloperSurface() {
  const { locale } = useLanguage();
  const copy = commerceCopy[locale].docs;
  const contracts = [[copy.contractLabels[0], "listProducts", "getProduct", copy.contractDetails[0]], [copy.contractLabels[1], "createCart", "addCartLine", copy.contractDetails[1]], [copy.contractLabels[2], "checkout", "myOrders", copy.contractDetails[2]], [copy.contractLabels[3], "adminOverview", "initializeDemoCatalog", copy.contractDetails[3]]];
  return <ShopShell><main className="docs-page"><header className="docs-hero"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.heroBefore} <em>{copy.heroEmphasis}</em></h1><p>{copy.heroBody}</p></header><section className="docs-layout"><aside><p>{copy.modules}</p><a href="#contracts">{copy.contracts}</a><a href="#extensions">{copy.extensions}</a><a href="#roadmap">{copy.roadmap}</a></aside><div><section id="contracts" className="docs-section"><div className="docs-heading"><Braces /><div><p className="eyebrow">{copy.typedApi}</p><h2>{copy.currentContracts}</h2></div></div><div className="contract-table">{contracts.map(contract => <div key={contract[0]}><b>{contract[0]}</b><code>{contract[1]}</code><code>{contract[2]}</code><span>{contract[3]}</span></div>)}</div></section><section id="extensions" className="docs-section"><div className="docs-heading"><GitBranch /><div><p className="eyebrow">{copy.extensionEyebrow}</p><h2>{copy.extensionTitle}</h2></div></div><pre><code>{`export type CommerceExtensionManifest = {
  id: string;
  version: string;
  compatibility: string;
  contributes: { connectorIds?: string[] };
}`}</code></pre><p>{copy.extensionBody}</p></section><section id="roadmap" className="docs-section"><div className="docs-heading"><TerminalSquare /><div><p className="eyebrow">{copy.roadmapEyebrow}</p><h2>{copy.roadmapTitle}</h2></div></div><div className="roadmap-list"><p><FileJson /> {copy.milestoneGraphql}</p><p><Code2 /> {copy.milestoneTheme}</p><p><GitBranch /> {copy.milestonePayments}</p></div></section></div></section></main></ShopShell>;
}
