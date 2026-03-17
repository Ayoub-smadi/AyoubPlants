import { Leaf, MapPin, Phone, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";

export function Footer() {
  const { t, lang } = useI18n();

  return (
    <footer className="bg-secondary/30 pt-16 pb-8 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-bold text-2xl tracking-tight">
                {lang === 'ar' ? 'روضة النباتات' : 'Al Rawdah Nursery'}
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">{t('categories')}</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link href="/plants?category=indoor" className="hover:text-primary transition-colors">Indoor Plants</Link></li>
              <li><Link href="/plants?category=outdoor" className="hover:text-primary transition-colors">Outdoor Plants</Link></li>
              <li><Link href="/plants?category=succulents" className="hover:text-primary transition-colors">Succulents</Link></li>
              <li><Link href="/plants?category=tools" className="hover:text-primary transition-colors">Tools & Pots</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">{t('contact')}</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>123 Green Valley Road, Plant District, City</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span dir="ltr">+971 50 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>hello@alrawdahnursery.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Al Rawdah Nursery. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
