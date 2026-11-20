import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c1-b2',
  chapter: 1,
  order: 2,
  title: 'Excel và database',
  lead: 'Excel là công cụ tốt. Bài này chỉ ra ba lúc database làm tốt hơn.',
  minutes: 12,
  goals: [
    'Kể ba khác biệt giữa Excel và database',
    'Biết khi nào Excel vẫn là lựa chọn tốt',
    'Hiểu vì sao hai người ghi cùng lúc có thể làm mất dữ liệu',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hai thu ngân, một file Excel',
      paragraphs: [
        'Tiệm trà sữa mở thêm quầy thứ hai. Chủ tiệm có sẵn một file Excel ghi đơn, nên cả hai thu ngân cùng dùng file đó.',
        'Chiều thứ bảy khách đông. Hai thu ngân cùng thêm đơn vào cuối file, gần như cùng một giây.',
        'Cuối ngày chủ tiệm đếm lại. Thiếu một đơn. Không ai biết đơn nào mất.',
        'Mình là Bi, người giữ kho của tiệm. Mình hay gặp chuyện này. Excel làm tốt khi chỉ một người dùng. Khi nhiều người cùng ghi thì Excel dễ vấp.',
        'Thử ba tình huống bên dưới để thấy database xử lý khác ra sao.',
      ],
    },
    {
      type: 'scene',
      scene: 'excel-vs-db',
      title: 'Excel và database, đặt cạnh nhau',
      intro: 'Có ba thẻ thí nghiệm. Bấm từng thẻ và so Excel với database.',
    },
    {
      type: 'text',
      title: 'Ba khác biệt',
      paragraphs: [
        'Khác biệt đầu tiên là nhiều người ghi cùng lúc. **[[database]]** nhận nhiều lần ghi trong một giây và giữ lại tất cả.',
        'Excel không lo cảnh đó. Hai người lưu một file cùng lúc thì bản lưu sau có thể đè bản trước.',
        'Khác biệt thứ hai là luật giữ dữ liệu đúng. Ô giá trong Excel nhận cả chữ lẫn số, nên ai gõ gì cũng lọt.',
        'Database cho mỗi **[[column]]** một **[[data-type]]**. Column giá chỉ nhận số, và database từ chối giá trị sai.',
        'Khác biệt thứ ba là cỡ dữ liệu. Một sheet Excel chứa tối đa 1.048.576 row. Quá số đó thì file hết chỗ.',
        'Database chứa nhiều hơn thế rất xa. Dữ liệu càng lớn, database càng có lợi.',
        'Dữ liệu nhỏ và chỉ một người dùng thì cứ dùng Excel. Danh sách chi tiêu cá nhân, danh sách học phí của lớp, đều hợp với Excel.',
      ],
    },
    {
      type: 'quiz',
      title: 'Bài tập',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi tình huống với cách xử lý của database.',
          pairs: [
            { left: 'Hai thu ngân ghi cùng lúc', right: 'Giữ cả hai đơn' },
            { left: 'Gõ chữ vào ô giá', right: 'Từ chối giá trị sai' },
            { left: 'Dữ liệu lên tới nhiều triệu row', right: 'Vẫn chạy bình thường' },
          ],
          done: 'Đúng hết rồi. Ba khác biệt này là lý do tiệm lớn dùng database.',
        },
        {
          kind: 'choice',
          question: 'Bạn lập danh sách chi tiêu của riêng mình, mỗi tháng chừng ba mươi khoản. Nên dùng gì?',
          options: [
            { text: 'Excel', correct: true, feedback: 'Đúng. Một người dùng và dữ liệu nhỏ thì Excel gọn và đủ.' },
            { text: 'Database', feedback: 'Database làm được, nhưng hơi thừa cho một danh sách nhỏ của riêng bạn.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'YouTube và lúc MySQL sắp quá tải',
      paragraphs: [
        'Năm 2010, YouTube có quá nhiều người dùng và MySQL của họ sắp quá tải.',
        'Họ viết ra Vitess, một công cụ giúp MySQL chạy được ở cỡ lớn hơn.',
        'Dữ liệu lớn tới mức đó thì Excel không còn dùng được.',
      ],
      source: { name: 'Vitess: History', url: 'https://vitess.io/docs/overview/history/' },
    },
    {
      type: 'keypoints',
      items: [
        'Database nhận nhiều người ghi cùng lúc và không làm mất đơn.',
        'Mỗi column có data type, database từ chối giá trị sai kiểu.',
        'Một sheet Excel chứa tối đa 1.048.576 row.',
        'Dữ liệu nhỏ và ít người dùng thì Excel vẫn tốt.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        {
          name: 'Microsoft: Excel specifications and limits',
          url: 'https://support.microsoft.com/en-us/office/excel-specifications-and-limits-1672b34d-7043-467e-8e27-269d656771c3',
        },
        { name: 'Vitess: History', url: 'https://vitess.io/docs/overview/history/' },
      ],
    },
  ],
};
