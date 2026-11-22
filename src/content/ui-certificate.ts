export const uiCertificate = {
  title: 'Giấy chứng nhận',
  filename: 'learn-database-chung-nhan.png',
  storageKey: 'ldb:name',

  locked: {
    bi: (lessonsDone: number, lessonsTotal: number, bossDone: number, bossTotal: number) =>
      `Bạn đã xong ${lessonsDone} trên ${lessonsTotal} bài và ${bossDone} trên ${bossTotal} bài boss. Xong hết cả hai thì mình trao giấy cho bạn.`,
    lessonsChip: 'Bài học',
    bossChip: 'Bài boss',
    back: 'Về mục lục',
    previewNote: 'Đây là bản xem trước. Giấy thật có tên của bạn.',
  },

  open: {
    bi: 'Bạn xong hết rồi. Chúc mừng bạn! Gõ tên để mình ghi lên giấy.',
    biNeedName: 'Gõ tên của bạn vào ô bên dưới. Có tên rồi thì nút tải sẽ mở.',
    nameLabel: 'Tên của bạn',
    namePlaceholder: 'Nguyễn Văn A',
    maxLength: 40,
    download: 'Tải ảnh PNG',
    downloadFail: 'Không tải được ảnh. Bấm lại lần nữa.',
  },

  alt: (name: string, chapterCount: number) =>
    name
      ? `Giấy chứng nhận của ${name}: đã học xong ${chapterCount} chương về database và SQL, điểm 10, lời phê Giỏi lắm.`
      : 'Bản xem trước của giấy chứng nhận Learn Database.',

  paper: {
    site: 'Learn Database',
    heading: 'Giấy chứng nhận',
    giveTo: 'Trao cho',
    sentence: (chapterCount: number) => `đã học xong ${chapterCount} chương về database và SQL`,
    datePrefix: 'Ngày',
    score: '10',
    praise: 'Giỏi lắm',
    preview: 'Bản xem trước',
    previewName: 'Tên của bạn',
  },
} as const;
