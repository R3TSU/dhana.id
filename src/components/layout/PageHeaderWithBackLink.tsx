import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderWithBackLinkProps {
  href: string;
  linkText: string;
}

export default function PageHeaderWithBackLink({ href, linkText }: PageHeaderWithBackLinkProps) {
  return (
    <header className="p-4">
      <div className="container mx-auto px-4">
        <nav>
          <Link href={href} className="inline-flex items-center text-sm font-medium text-white hover:text-gray-300 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            {linkText}
          </Link>
        </nav>
      </div>
    </header>
  );
}
