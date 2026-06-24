import Link from 'next/link';
import { 
  FileText, 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  FolderOpen
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-primary/20">
              P
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Perez Perícia
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#kanban" className="hover:text-foreground transition-colors">Kanban</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              id="btn-login-nav"
              className="text-sm font-medium hover:text-primary transition-colors px-4 py-2"
            >
              Login
            </Link>
            <Link 
              href="/cadastro" 
              id="btn-register-nav"
              className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              Teste Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-secondary/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>Mini-SaaS de Gestão Pericial Inteligente</span>
          </div>

          <h1 className="font-outfit text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight md:leading-none text-foreground mb-6">
            Sua rotina pericial organizada, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">automatizada e sob controle</span>
          </h1>

          <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Centralize processos, prazos de entrega, vistorias e honorários em um só lugar. Desenvolvido para peritos judiciais, assistentes técnicos e escritórios de perícia que desejam eliminar planilhas manuais.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/cadastro" 
              id="hero-cta-primary"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Começar Teste Grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#features" 
              id="hero-cta-secondary"
              className="w-full sm:w-auto glass-effect hover:bg-card border border-border text-foreground font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center"
            >
              Conhecer Recursos
            </a>
          </div>

          {/* Visual Product Mockup */}
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-border bg-card/50 shadow-2xl p-4 md:p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span className="w-3 h-3 rounded-full bg-warning" />
                <span className="w-3 h-3 rounded-full bg-success" />
              </div>
              <div className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-background border border-border text-muted-foreground">
                perez-pericia.com.br/dashboard
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="md:col-span-2 space-y-6">
                {/* Simulated KPIs */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background border border-border p-4 rounded-xl">
                    <span className="text-xs font-medium text-muted-foreground">Processos Ativos</span>
                    <h3 className="text-2xl font-bold mt-1 text-primary">28</h3>
                  </div>
                  <div className="bg-background border border-border p-4 rounded-xl">
                    <span className="text-xs font-medium text-muted-foreground">Prazos Críticos</span>
                    <h3 className="text-2xl font-bold mt-1 text-destructive">4</h3>
                  </div>
                  <div className="bg-background border border-border p-4 rounded-xl">
                    <span className="text-xs font-medium text-muted-foreground">Laudos em Elaboração</span>
                    <h3 className="text-2xl font-bold mt-1 text-warning">12</h3>
                  </div>
                </div>

                {/* Simulated Chart Area */}
                <div className="bg-background border border-border p-5 rounded-xl h-64 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Previsão de Faturamento</span>
                    <span className="text-xs text-success bg-success/15 px-2 py-0.5 rounded-full font-bold">+24% este mês</span>
                  </div>
                  <div className="flex items-end gap-3 h-36 px-4">
                    <div className="flex-1 bg-muted/20 hover:bg-primary/50 transition-colors h-[40%] rounded-t-md" />
                    <div className="flex-1 bg-muted/20 hover:bg-primary/50 transition-colors h-[65%] rounded-t-md" />
                    <div className="flex-1 bg-muted/20 hover:bg-primary/50 transition-colors h-[50%] rounded-t-md" />
                    <div className="flex-1 bg-primary/80 h-[85%] rounded-t-md" />
                    <div className="flex-1 bg-secondary/80 h-[95%] rounded-t-md" />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-2">
                    <span>Fev</span>
                    <span>Mar</span>
                    <span>Abr</span>
                    <span>Mai</span>
                    <span>Jun</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Checklist */}
              <div className="bg-background border border-border p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    Prazos Mais Urgentes
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-destructive">Proc. nº 100234-92</span>
                        <span className="text-destructive">Amanhã</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Elaboração de Laudo - 3ª Vara Cível</span>
                    </div>
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-warning">Proc. nº 98014-11</span>
                        <span className="text-warning">Em 3 dias</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Diligência Campo - Comarca Pinheiros</span>
                    </div>
                    <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Proc. nº 11843-85</span>
                        <span className="text-muted-foreground">Em 7 dias</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Revisão Técnico-Laudo</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Fernando Perez</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase">Perito Judicial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Tudo o que seu escritório de perícia precisa
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Desenvolvemos uma suite completa de ferramentas inspiradas no Projuris ADV e nos melhores sistemas de perícia do país.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* feature 1 */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-3 text-foreground">Dashboard 360º</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Indicadores em tempo real para controle de processos suspensos, ativos e concluídos, com semáforo de cores para urgência.
              </p>
            </div>

            {/* feature 2 */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-3 text-foreground">Gestão Visual Kanban</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Acompanhe o fluxo de trabalho arrastando cards da Nomeação à entrega final do laudo, com persistência automática de status.
              </p>
            </div>

            {/* feature 3 */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-3 text-foreground">Honorários Periciais</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Registro de propostas, controle de depósitos prévios, alvarás de levantamento e previsão de recebíveis automatizada.
              </p>
            </div>

            {/* feature 4 */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center mb-6">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-3 text-foreground">GED e Documentos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload e organização ágil de PDFs, imagens e planilhas técnicas diretamente vinculados a cada processo judicial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Planos e Assinaturas Simples
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Escolha a melhor opção para a sua estrutura, seja você um perito individual ou um grande escritório técnico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 1 */}
            <div className="bg-card border border-border p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10">Plano Perito</span>
                <h3 className="font-outfit text-2xl font-bold mt-4 text-foreground">Individual</h3>
                <p className="text-sm text-muted-foreground mt-2">Perfeito para peritos autônomos que buscam organizar seu fluxo de trabalho pessoal.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-foreground">R$ 99</span>
                  <span className="text-muted-foreground text-sm"> / mês</span>
                </div>
                <ul className="space-y-3.5 text-sm mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span>Até 50 processos ativos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span>Kanban completo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span>Controle de Honorários básico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span>1 User (Perito principal)</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/cadastro" 
                className="w-full text-center bg-foreground text-background hover:bg-foreground/90 font-bold py-3 rounded-xl transition-all block"
              >
                Assinar Plano Perito
              </Link>
            </div>

            {/* Plan 2 */}
            <div className="bg-card border-primary p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-md ring-1 ring-primary">
              <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-bold px-4 py-1 rounded-bl-lg">
                Recomendado
              </div>
              <div>
                <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10">Plano Escritório</span>
                <h3 className="font-outfit text-2xl font-bold mt-4 text-foreground">Equipe Premium</h3>
                <p className="text-sm text-muted-foreground mt-2">Para escritórios que trabalham com peritos e assistentes em colaboração direta.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-foreground">R$ 199</span>
                  <span className="text-muted-foreground text-sm"> / mês</span>
                </div>
                <ul className="space-y-3.5 text-sm mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span className="font-semibold text-foreground">Processos ativos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span>Kanban com múltiplos responsáveis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span>Controle Financeiro avançado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    <span>Usuários ilimitados (Peritos e Assistentes)</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/cadastro?plano=escritorio" 
                className="w-full text-center bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all block shadow-md shadow-primary/20"
              >
                Assinar Plano Escritório
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-md">
              P
            </div>
            <span className="font-outfit text-md font-bold tracking-tight text-foreground">
              Perez Perícia
            </span>
          </div>
          
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Perez Perícia. Todos os direitos reservados.
          </span>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-success" />
              Conexão Segura SSL
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
