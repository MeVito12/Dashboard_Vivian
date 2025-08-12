import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Loading from '@/components/ui/loading';

interface SectionLoaderProps {
  text?: string;
  height?: string;
}

const SectionLoader: React.FC<SectionLoaderProps> = ({ 
  text = 'Carregando dados...', 
  height = 'h-64' 
}) => {
  return (
    <Card className="main-card">
      <CardContent className={`${height} flex items-center justify-center`}>
        <Loading text={text} size="md" />
      </CardContent>
    </Card>
  );
};

export default SectionLoader;