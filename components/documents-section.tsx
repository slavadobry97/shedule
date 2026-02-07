import { DocumentCategory } from '@/types/documents';
import { DocumentCard } from '@/components/document-card';

interface DocumentsSectionProps {
  category: DocumentCategory;
}

export function DocumentsSection({ category }: DocumentsSectionProps) {
  return (
    <section className="container mx-auto flex flex-col items-center space-y-3 md:space-y-4">
      <h2 className="text-xl md:text-3xl font-bold px-2 md:px-0 text-center">
        {category.title}
      </h2>
      <div className="mx-4 flex sm:flex-col-2 flex-wrap justify-center gap-3 md:gap-4">
        {category.documents.map((document) => (
          <div
            key={document.id}
            className="w-full sm:w-72 lg:w-72"
          >
            <DocumentCard document={document} />
          </div>
        ))}
      </div>
    </section>
  );
}

