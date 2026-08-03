import PropertyDetailClient from './PropertyDetailClient';

export function generateStaticParams() {
  return [
    { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' },
    { id: '6' }, { id: '7' }, { id: '8' }, { id: '9' }, { id: '10' }
  ];
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <PropertyDetailClient params={params} />;
}
