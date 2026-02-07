import { Document, DocumentCategory } from '@/types/documents';

export const documents: Document[] = [
  {
    id: 1,
    department: 'ОСО',
    documentType: 'Справка о том, что гражданин является обучающимся учреждения образования (о получении первого высшего образования)',
    room: '303',
    purpose: 'Для предоставления стандартных и социальных вычетов по подоходному налогу',
    destination: 'По месту требования',
    issueDays: 'По мере готовности',
    requirements: '-',    
    link: 'https://forms.gle/VAQH9RhvAcZXoea9A'
    
  },
  {
    id: 2,
    department: 'Отдел кадров',
    documentType: 'Справка в военкомат о том, что гражданин является обучающимся учреждения образования',
    room: '206',
    purpose: 'Для подтверждения обучения',
    destination: 'Районный военный комиссариат',
    issueDays: 'От 3 до 5 рабочих дней',
    requirements: 'Документ, удостоверяющий личность',
    link: 'https://forms.yandex.ru/cloud/674e03b502848fb6981de002/'
  },
  {
    id: 3,
    department: 'Отдел кадров',
    documentType: 'Справка в соц. защиту для получения пенсии по случаю потери кормильца',    
    room: '206',
    purpose: 'Для подтверждения обучения',
    destination: 'Управление социальной защиты',
    issueDays: 'От 3 до 5 рабочих дней',
    requirements: 'Документ, удостоверяющий личность',
    link: 'https://forms.yandex.ru/cloud/68b4ad5cd0468822bfbd6420/'
  },
  {
    id: 4,
    department: 'Отдел кадров',
    documentType: 'Копия документа о предыдущем образовании; копия договора об оказании платных образовательных услуг',
    room: '206',
    purpose: '-',
    destination: 'По месту требования',
    issueDays: 'Понедельник, среда, пятница с 13:30-17:30',
    requirements: 'Документ, удостоверяющий личность',
    link: 'https://forms.yandex.ru/cloud/674f1e0de010db00b3b2e55e/'
  },
  {
    id: 5,
    department: 'Бухгалтерия',
    documentType: 'Дополнительное соглашение к договору об изменении стоимости',
    room: '305',
    purpose: '-',
    destination: 'По месту требования',
    issueDays: 'Среда с 13:30-17:00',
    requirements: 'Документ, удостоверяющий личность',
    link: 'https://docs.google.com/forms/d/1U1rW4ayw1RpfAYXabVgCp55C7eG6-reD3FDw8BOdOWo/edit'
  },
  {
    id: 6,
    department: 'Бухгалтерия',
    documentType: 'О подтверждении произведенной оплаты за обучение (в случае утери квитанции об оплате)',
    room: '305',
    purpose: 'В случае утери квитанции об оплате за обучение',
    destination: 'На работу плательщикам за обучение',
    issueDays: 'Среда с 13:30-17:00',
    requirements: 'Документ, удостоверяющий личность',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLSfJ1jB7MvuOq6l3HNxOBbgtLgSsGgNMvqI6LhFPmMixRrFf9Q/viewform'
  }
];

export const documentCategories: DocumentCategory[] = [
  {
    title: 'Справки об обучении',
    documents: documents.filter(doc => 
      doc.documentType.toLowerCase().includes('справка') || 
      doc.documentType.toLowerCase().includes('копия')
    )
  },
  {
    title: 'Документы по оплате',
    documents: documents.filter(doc => 
      doc.documentType.toLowerCase().includes('оплат') || 
      doc.documentType.toLowerCase().includes('стоимост')
    )
  }
];
