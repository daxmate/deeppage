// ==============================================
// DeepPage — 多语言支持
// ==============================================

// 翻译数据（从 messages.json 生成）
const LANG_CODES = [
  "zh_CN",
  "en",
  "ja",
  "zh_TW",
  "ko",
  "es",
  "fr",
  "de",
  "ru",
  "vi"
];

const TRANSLATIONS = {
  appName: ["DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage"],
  appDesc: ["在浏览网页时与 DeepSeek 对话——总结全文、提炼要点、自由问答", "Chat with DeepSeek while browsing — summarize, outline, translate, and ask questions", "ウェブ閲覧中にDeepSeekと会話 — 要約、要点抽出、翻訳、自由な質問", "在瀏覽網頁時與 DeepSeek 對話——總結全文、提煉要點、自由問答", "웹 탐색 중 DeepSeek와 대화 — 요약, 핵심 정리, 번역, 자유 질문", "Chatea con DeepSeek mientras navegas — resume, extrae puntos clave, traduce y pregunta", "Discutez avec DeepSeek pendant la navigation — résumer, points clés, traduire, poser des questions", "Chatte mit DeepSeek beim Surfen — zusammenfassen, Schlüsselpunkte, übersetzen, Fragen stellen", "Общайтесь с DeepSeek во время просмотра — резюмируйте, выделяйте ключевые моменты, переводите, задавайте вопросы", "Trò chuyện với DeepSeek trong khi duyệt web — tóm tắt, rút gọn ý chính, dịch thuật, hỏi đáp"],
  panelTitle: ["DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage", "DeepPage"],
  inputPlaceholder: ["输入问题...", "Ask anything...", "質問を入力...", "輸入問題...", "질문 입력...", "Pregunta algo...", "Posez une question...", "Frage eingeben...", "Задайте вопрос...", "Nhập câu hỏi..."],
  contextLoaded: ["已加载「$1」作为对话背景", "Loaded \"$1\" as conversation context", "「$1」を会話の背景として読み込みました", "已載入「$1」作為對話背景", "\"$1\"을(를) 대화 배경으로 불러왔습니다", "Se cargó «$1» como contexto de conversación", "« $1 » chargé comme contexte de conversation", "„$1“ als Gesprächskontext geladen", "«$1» загружен как контекст беседы", "Đã tải «$1» làm ngữ cảnh hội thoại"],
  loginNoticeTitle: ["需要配置 DeepSeek API Key", "DeepSeek API Key Required", "DeepSeek API キーが必要です", "需要設定 DeepSeek API Key", "DeepSeek API 키가 필요합니다", "Se requiere una clave de API de DeepSeek", "Clé API DeepSeek requise", "DeepSeek-API-Schlüssel erforderlich", "Требуется ключ API DeepSeek", "Yêu cầu khóa API DeepSeek"],
  loginNoticeStep1: ["· 点击扩展图标 → 选项 → 输入 API Key", "· Click extension icon → Options → Enter API Key", "· 拡張機能アイコン → オプション → APIキーを入力", "· 點擊擴充功能圖示 → 選項 → 輸入 API Key", "· 확장 프로그램 아이콘 → 옵션 → API 키 입력", "· Haz clic en el icono de la extensión → Opciones → Ingresa la clave API", "· Cliquez sur l\\'icône de l\\'extension → Options → Entrez la clé API", "· Klicke auf das Erweiterungssymbol → Optionen → API-Schlüssel eingeben", "· Нажмите на значок расширения → Параметры → Введите ключ API", "· Nhấp biểu tượng tiện ích → Tùy chọn → Nhập khóa API"],
  loginNoticeStep2: ["· 或去 platform.deepseek.com 获取", "· Or get one at platform.deepseek.com", "· または platform.deepseek.com で取得", "· 或前往 platform.deepseek.com 取得", "· 또는 platform.deepseek.com에서 받기", "· O consíguela en platform.deepseek.com", "· Ou obtenez-en une sur platform.deepseek.com", "· Oder hole einen auf platform.deepseek.com", "· Или получите его на platform.deepseek.com", "· Hoặc lấy tại platform.deepseek.com"],
  errorNoApiKey: ["❌ 未配置 API Key，请在扩展设置中配置", "❌ API Key not configured. Please set it in the extension options.", "❌ API キーが設定されていません。拡張機能のオプションで設定してください。", "❌ 未設定 API Key，請在擴充功能設定中設定", "❌ API 키가 설정되지 않았습니다. 확장 프로그램 옵션에서 설정해주세요.", "❌ Clave API no configurada. Configúrala en las opciones de la extensión.", "❌ Clé API non configurée. Veuillez la configurer dans les options de l\\'extension.", "❌ Kein API-Schlüssel konfiguriert. Bitte in den Erweiterungsoptionen einrichten.", "❌ Ключ API не настроен. Пожалуйста, настройте его в параметрах расширения.", "❌ Chưa cấu hình khóa API. Vui lòng cấu hình trong tùy chọn tiện ích."],
  optionTitle: ["DeepPage 设置", "DeepPage Settings", "DeepPage 設定", "DeepPage 設定", "DeepPage 설정", "Configuración de DeepPage", "Paramètres DeepPage", "DeepPage-Einstellungen", "Настройки DeepPage", "Cài đặt DeepPage"],
  optionDesc: ["使用 DeepSeek 官方 API 与浏览的网页对话", "Chat with DeepSeek using the official API while browsing the web", "DeepSeek 公式 API を使用してウェブ閲覧中にチャット", "使用 DeepSeek 官方 API 與瀏覽的網頁對話", "DeepSeek 공식 API를 사용하여 웹 탐색 중 채팅", "Chatea con DeepSeek usando la API oficial mientras navegas por la web", "Discutez avec DeepSeek via l\\'API officielle en naviguant sur le web", "Chatte mit DeepSeek über die offizielle API beim Surfen im Web", "Общайтесь с DeepSeek через официальный API во время просмотра веб-страниц", "Trò chuyện với DeepSeek bằng API chính thức trong khi duyệt web"],
  apiKeyLabel: ["API Key", "API Key", "API Key", "API Key", "API Key", "Clave de API", "Clé API", "API-Schlüssel", "Ключ API", "Khóa API"],
  apiKeyPlaceholder: ["sk-...", "sk-...", "sk-...", "sk-...", "sk-...", "sk-...", "sk-...", "sk-...", "sk-...", "sk-..."],
  getApiKeyLink: ["从 platform.deepseek.com 获取", "Get one at platform.deepseek.com", "platform.deepseek.com で取得", "從 platform.deepseek.com 取得", "platform.deepseek.com에서 받기", "Consíguela en platform.deepseek.com", "Obtenez-en une sur platform.deepseek.com", "Hole einen auf platform.deepseek.com", "Получить на platform.deepseek.com", "Lấy tại platform.deepseek.com"],
  quickActionsSection: ["快捷操作按钮", "Quick Action Buttons", "クイックアクションボタン", "快速操作按鈕", "빠른 작업 버튼", "Botones de acción rápida", "Boutons d\\'action rapide", "Schnellaktion-Buttons", "Кнопки быстрых действий", "Nút thao tác nhanh"],
  addButton: ["＋ 添加按钮", "＋ Add Button", "＋ ボタンを追加", "＋ 新增按鈕", "＋ 버튼 추가", "＋ Añadir botón", "＋ Ajouter un bouton", "＋ Button hinzufügen", "＋ Добавить кнопку", "＋ Thêm nút"],
  saveButton: ["保存", "Save", "保存", "儲存", "저장", "Guardar", "Enregistrer", "Speichern", "Сохранить", "Lưu"],
  savedSuccess: ["✅ 已保存", "✅ Saved", "✅ 保存しました", "✅ 已儲存", "✅ 저장됨", "✅ Guardado", "✅ Enregistré", "✅ Gespeichert", "✅ Сохранено", "✅ Đã lưu"],
  apiKeyRequired: ["请输入 API Key", "Please enter an API Key", "API キーを入力してください", "請輸入 API Key", "API 키를 입력해주세요", "Por favor, ingresa una clave de API", "Veuillez entrer une clé API", "Bitte gib einen API-Schlüssel ein", "Пожалуйста, введите ключ API", "Vui lòng nhập khóa API"],
  buttonLabel: ["按钮文字", "Button Label", "ボタンラベル", "按鈕文字", "버튼 라벨", "Texto del botón", "Étiquette du bouton", "Button-Beschriftung", "Текст кнопки", "Nhãn nút"],
  promptLabel: ["提示词", "Prompt", "プロンプト", "提示詞", "프롬프트", "Indicación", "Invite", "Eingabeaufforderung", "Подсказка", "Lời nhắc"],
  buttonLabelPlaceholder: ["如 📝 总结全文", "e.g. 📝 Summarize", "例 📝 要約", "如 📝 總結全文", "예: 📝 요약", "ej. 📝 Resumir", "ex. 📝 Résumer", "z. B. 📝 Zusammenfassen", "например 📝 Резюме", "vd 📝 Tóm tắt"],
  promptPlaceholder: ["点击按钮时自动输入的提示词", "Prompt text sent when button is clicked", "ボタンクリック時に送信されるプロンプト", "點擊按鈕時自動輸入的提示詞", "버튼 클릭 시 자동 입력되는 프롬프트", "Indicación enviada al hacer clic en el botón", "Invite envoyée lors du clic sur le bouton", "Text, der beim Klicken auf den Button gesendet wird", "Текст, отправляемый при нажатии кнопки", "Lời nhắc tự động gửi khi nhấp nút"],
  deleteButton: ["删除", "Delete", "削除", "刪除", "삭제", "Eliminar", "Supprimer", "Löschen", "Удалить", "Xóa"],
  copyButton: ["复制", "Copy", "コピー", "複製", "복사", "Copiar", "Copier", "Kopieren", "Копировать", "Sao chép"],
  historyButton: ["历史", "History", "履歴", "歷史", "기록", "Historial", "Historique", "Verlauf", "История", "Lịch sử"],
  backToChat: ["返回", "Back", "戻る", "返回", "돌아가기", "Volver", "Retour", "Zurück", "Назад", "Quay lại"],
  historyEmpty: ["暂无对话", "No conversations", "会話がありません", "暫無對話", "대화가 없습니다", "Sin conversaciones", "Aucune conversation", "Keine Unterhaltungen", "Нет диалогов", "Chưa có cuộc trò chuyện"],
  historySearchPlaceholder: ["搜索对话…", "Search conversations…", "会話を検索…", "搜尋對話…", "대화 검색…", "Buscar conversaciones…", "Rechercher des conversations…", "Unterhaltungen suchen…", "Поиск диалогов…", "Tìm kiếm cuộc trò chuyện…"],
  historyNoMatch: ["无匹配对话", "No matching conversations", "一致する会話がありません", "無符合的對話", "일치하는 대화가 없습니다", "Sin conversaciones coincidentes", "Aucune conversation correspondante", "Keine passenden Unterhaltungen", "Нет подходящих диалогов", "Không có cuộc trò chuyện phù hợp"],
  justNow: ["刚刚", "just now", "たった今", "剛剛", "방금", "ahora mismo", "à l\\'instant", "gerade eben", "только что", "vừa xong"],
  newChat: ["新对话", "New Chat", "新規会話", "新對話", "새 대화", "Nueva conversación", "Nouvelle conversation", "Neue Unterhaltung", "Новый диалог", "Cuộc trò chuyện mới"],
  newChatShort: ["新对话", "New", "新規", "新對話", "새로 만들기", "Nuevo", "Nouveau", "Neu", "Новый", "Mới"],
  selAskButton: ["💬 对此段提问", "💬 Ask about selection", "💬 選択部分について質問", "💬 對此段提問", "💬 선택한 내용 질문", "💬 Preguntar sobre selección", "💬 Questionner la sélection", "💬 Auswahl befragen", "💬 Спросить о выделенном", "💬 Hỏi về đoạn đã chọn"],
  selContextLabel: ["选中内容", "Selection", "選択内容", "選中內容", "선택 내용", "Selección", "Sélection", "Auswahl", "Выделенное", "Đoạn chọn"],
  maxRoundsLabel: ["最大对话轮数", "Max Conversation Rounds", "最大会話ラウンド数", "最大對話輪數", "최대 대화 라운드", "Máximo de rondas", "Maximum de tours", "Maximale Gesprächsrunden", "Максимум раундов", "Số vòng tối đa"],
  maxRoundsDesc: ["超过此轮数的早期消息将被自动裁剪，避免超出 token 限制", "Older messages beyond this limit will be trimmed to avoid token overflow", "この数を超える古いメッセージは自動的に削除され、トークン制限を回避します", "超過此輪數的早期消息將被自動裁剪，避免超出 token 限制", "이 수를 초과하는 이전 메시지는 토큰 제한을 피하기 위해 자동으로 정리됩니다", "Los mensajes antiguos que superen este límite se recortarán para evitar exceder tokens", "Les messages anciens au-delà de cette limite seront supprimés pour éviter le dépassement de tokens", "Ältere Nachrichten über diesem Limit werden automatisch gekürzt", "Старые сообщения сверх этого лимита будут автоматически обрезаны", "Các tin nhắn cũ vượt quá giới hạn này sẽ tự động bị cắt để tránh vượt quá token"],
  clearContextBtn: ["清除上下文", "Clear Context", "コンテキストをクリア", "清除上下文", "컨텍스트 지우기", "Limpiar contexto", "Effacer le contexte", "Kontext löschen", "Очистить контекст", "Xóa ngữ cảnh"],
  contextCleared: ["已清除上下文", "Context cleared", "コンテキストをクリアしました", "已清除上下文", "컨텍스트가 지워졌습니다", "Contexto limpiado", "Contexte effacé", "Kontext gelöscht", "Контекст очищен", "Đã xóa ngữ cảnh"],
  exportButton: ["导出对话", "Export", "会話をエクスポート", "導出對話", "내보내기", "Exportar", "Exporter", "Exportieren", "Экспорт", "Xuất"],
  exportMarkdown: ["复制 Markdown", "Copy Markdown", "Markdown をコピー", "複製 Markdown", "Markdown 복사", "Copiar Markdown", "Copier Markdown", "Markdown kopieren", "Копировать Markdown", "Sao chép Markdown"],
  exportText: ["复制纯文本", "Copy Plain Text", "プレーンテキストをコピー", "複製純文字", "일반 텍스트 복사", "Copiar texto plano", "Copier le texte brut", "Klartext kopieren", "Копировать текст", "Sao chép văn bản"],
  exportDownload: ["下载 .md 文件", "Download .md", ".md ファイルをダウンロード", "下載 .md 文件", ".md 다운로드", "Descargar .md", "Télécharger .md", ".md herunterladen", "Скачать .md", "Tải xuống .md"],
  exportExported: ["已复制到剪贴板", "Copied to clipboard", "クリップボードにコピーしました", "已複製到剪貼板", "클립보드에 복사됨", "Copiado al portapapeles", "Copié dans le presse-papier", "In Zwischenablage kopiert", "Скопировано в буфер обмена", "Đã sao chép vào clipboard"],
  apiTypeLabel: ["API 格式", "API Format", "API 形式", "API 格式", "API 형식", "Formato de API", "Format d\\'API", "API-Format", "Формат API", "Định dạng API"],
  apiBaseUrlLabel: ["接口地址", "Base URL", "ベース URL", "接口地址", "Base URL", "URL base", "URL de base", "Basis-URL", "Базовый URL", "URL cơ sở"],
  apiBaseUrlHint: ["填写完整的 API 基础路径（如 /v1 后缀）", "Full base path (e.g., including /v1 suffix)", "完全な API ベースパス（例: /v1 接尾辞を含む）", "填寫完整的 API 基礎路徑（如 /v1 後綴）", "전체 API 기본 경로 (예: /v1 접미사 포함)", "Ruta base completa (incluyendo sufijo /v1)", "Chemin de base complet (incluant le suffixe /v1)", "Vollständiger Basispfad (einschließlich /v1-Suffix)", "Полный базовый путь (включая суффикс /v1)", "Đường dẫn cơ sở đầy đủ (bao gồm hậu tố /v1)"],
  customLabel: ["🔧 自定义", "🔧 Custom", "🔧 カスタム", "🔧 自定義", "🔧 사용자 정의", "🔧 Personalizado", "🔧 Personnalisé", "🔧 Benutzerdefiniert", "🔧 Пользовательский", "🔧 Tùy chỉnh"],
  apiModelLabel: ["模型", "Model", "モデル", "模型", "모델", "Modelo", "Modèle", "Modell", "Модель", "Mô hình"],
  apiModelHint: ["输入你的端点支持的模型名称", "Enter your endpoint model name", "エンドポイントがサポートするモデル名を入力", "輸入你的端點支援的模型名稱", "엔드포인트가 지원하는 모델 이름 입력", "Nombre del modelo que soporta tu endpoint", "Nom du modèle supporté par votre endpoint", "Modellname, den Ihr Endpunkt unterstützt", "Название модели, поддерживаемой вашим endpoint", "Nhập tên mô hình mà endpoint của bạn hỗ trợ"],
  apiProviderLabel: ["API 提供商", "API Provider", "API プロバイダー", "API 提供商", "API 제공자", "Proveedor de API", "Fournisseur API", "API-Anbieter", "Поставщик API", "Nhà cung cấp API"],
  testApiLabel: ["测试连接", "Test Connection", "接続テスト", "測試連接", "연결 테스트", "Probar conexión", "Tester la connexion", "Verbindung testen", "Проверить соединение", "Kiểm tra kết nối"],
  testApiButton: ["测试连接", "Test Connection", "接続テスト", "測試連接", "연결 테스트", "Probar conexión", "Tester la connexion", "Verbindung testen", "Проверить соединение", "Kiểm tra kết nối"],
  testApiSuccess: ["✅ 连接成功", "✅ Connection OK", "✅ 接続成功", "✅ 連接成功", "✅ 연결 성공", "✅ Conexión exitosa", "✅ Connexion réussie", "✅ Verbindung OK", "✅ Соединение OK", "✅ Kết nối thành công"],
  testApiFailed: ["❌ 连接失败：", "❌ Connection failed: ", "❌ 接続失敗：", "❌ 連接失敗：", "❌ 연결 실패：", "❌ Conexión fallida：", "❌ Échec de connexion：", "❌ Verbindung fehlgeschlagen：", "❌ Ошибка соединения：", "❌ Kết nối thất bại："],
  testApiRequired: ["请先填写接口地址、API Key 和模型名称", "Fill in Base URL, API Key, and Model first", "先にベースURL、APIキー、モデル名を入力してください", "請先填寫接口地址、API Key 和模型名稱", "먼저 기본 URL, API 키 및 모델 이름을 입력하세요", "Primero complete la URL base, la clave API y el nombre del modelo", "Veuillez d'abord saisir l'URL de base, la clé API et le nom du modèle", "Bitte geben Sie zuerst Basis-URL, API-Schlüssel und Modellname ein", "Сначала укажите базовый URL, API-ключ и название модели", "Vui lòng điền URL cơ sở, API Key và tên mô hình trước"],
  tabApi: ["API", "API", "API", "API", "API", "API", "API", "API", "API", "API"],
  tabQuick: ["快捷按钮", "Quick Actions", "クイック操作", "快捷按鈕", "빠른 작업", "Acciones rápidas", "Actions rapides", "Schnellaktionen", "Быстрые действия", "Thao tác nhanh"],
  tabAppearance: ["外观", "Appearance", "外観", "外觀", "외관", "Apariencia", "Apparence", "Darstellung", "Внешний вид", "Giao diện"],
  selectModelPlaceholder: ["-- 选择或输入模型名称 --", "-- select or enter model name --", "-- モデルを選択または入力 --", "-- 選擇或輸入模型名稱 --", "-- 모델 선택 또는 입력 --", "-- seleccionar o introducir modelo --", "-- sélectionnez ou saisissez le modèle --", "-- Modell auswählen oder eingeben --", "-- выберите или введите модель --", "-- chọn hoặc nhập tên mô hình --"],
  apiProviderHint: ["选择 AI 服务提供商", "Choose your AI provider", "AIプロバイダーを選択", "選擇 AI 服務提供商", "AI 제공자를 선택하세요", "Elige tu proveedor de IA", "Choisissez votre fournisseur d\\'IA", "Wählen Sie Ihren KI-Anbieter", "Выберите поставщика ИИ", "Chọn nhà cung cấp AI"],
  apiTypeDesc: ["OpenAI 兼容接口或 Anthropic 格式", "OpenAI-compatible or Anthropic format", "OpenAI互換またはAnthropic形式", "OpenAI 兼容接口或 Anthropic 格式", "OpenAI 호환 또는 Anthropic 형식", "Compatible con OpenAI o formato Anthropic", "Compatible OpenAI ou format Anthropic", "OpenAI-kompatibel oder Anthropic-Format", "Совместимый с OpenAI или формат Anthropic", "Tương thích OpenAI hoặc định dạng Anthropic"],
  apiBaseUrlHint2: ["API 接口地址", "API endpoint address", "APIエンドポイントアドレス", "API 接口地址", "API 엔드포인트 주소", "Dirección del endpoint API", "Adresse du point de terminaison API", "API-Endpunktadresse", "Адрес конечной точки API", "Địa chỉ endpoint API"],
  apiKeyHint: ["输入你的 API Key", "Enter your API key", "APIキーを入力", "輸入你的 API Key", "API 키 입력", "Introduce tu clave API", "Entrez votre clé API", "API-Schlüssel eingeben", "Введите ваш ключ API", "Nhập API Key"],
  apiModelHint2: ["选择或输入模型名称", "Select or enter model name", "モデル名を選択または入力", "選擇或輸入模型名稱", "모델 이름 선택 또는 입력", "Selecciona o introduce el modelo", "Sélectionnez ou saisissez le modèle", "Modell auswählen oder eingeben", "Выберите или введите модель", "Chọn hoặc nhập tên mô hình"],
  testApiDesc: ["验证 API Key 和接口是否可用", "Verify API key and endpoint", "APIキーとエンドポイントを確認", "驗證 API Key 和接口是否可用", "API 키와 엔드포인트 확인", "Verificar clave API y endpoint", "Vérifier la clé API et le point de terminaison", "API-Schlüssel und Endpunkt überprüfen", "Проверить ключ API и конечную точку", "Xác minh API Key và endpoint"],
  languageDesc: ["界面语言", "Interface language", "インターフェース言語", "界面語言", "인터페이스 언어", "Idioma de la interfaz", "Langue de l\\'interface", "Oberflächensprache", "Язык интерфейса", "Ngôn ngữ giao diện"],
  darkModeDesc: ["使用深色主题", "Use dark theme", "ダークテーマを使用", "使用深色主題", "다크 테마 사용", "Usar tema oscuro", "Utiliser le thème sombre", "Dunkles Thema verwenden", "Использовать темную тему", "Sử dụng giao diện tối"],
  maxRoundsDesc2: ["超出限制的早期消息将被自动裁剪", "Older messages beyond this limit will be trimmed", "制限を超えた古いメッセージは自動的に削除されます", "超出限制的早期消息將被自動裁剪", "제한을 초과하는 이전 메시지가 자동으로 정리됩니다", "Los mensajes antiguos que superen el límite se recortarán", "Les messages anciens au-delà de cette limite seront supprimés", "Ältere Nachrichten über diesem Limit werden gekürzt", "Старые сообщения сверх лимита будут обрезаны", "Các tin nhắn cũ vượt quá giới hạn sẽ bị cắt"],
  sectionConfig: ["配置", "CONFIGURATION", "設定", "配置", "설정", "CONFIGURACIÓN", "CONFIGURATION", "KONFIGURATION", "КОНФИГУРАЦИЯ", "CẤU HÌNH"],
  sectionApi: ["API", "API", "API", "API", "API", "API", "API", "API", "API", "API"],
  sectionQuick: ["快捷按钮", "Quick Actions", "クイック操作", "快捷按鈕", "빠른 작업", "Acciones rápidas", "Actions rapides", "Schnellaktionen", "Быстрые действия", "Thao tác nhanh"],
  sectionPreferences: ["偏好", "PREFERENCES", "環境設定", "偏好", "환경 설정", "PREFERENCIAS", "PRÉFÉRENCES", "EINSTELLUNGEN", "НАСТРОЙКИ", "TÙY CHỈNH"],
  sectionAppearance: ["外观", "Appearance", "外観", "外觀", "외관", "Apariencia", "Apparence", "Darstellung", "Внешний вид", "Giao diện"],
  groupConnection: ["连接", "CONNECTION", "接続", "連接", "연결", "CONEXIÓN", "CONNEXION", "VERBINDUNG", "ПОДКЛЮЧЕНИЕ", "KẾT NỐI"],
  groupEndpoint: ["接口", "ENDPOINT", "エンドポイント", "接口", "엔드포인트", "ENDPOINT", "ENDPOINT", "ENDPUNKT", "ENDPOINT", "ENDPOINT"],
  groupLanguage: ["语言", "LANGUAGE", "言語", "語言", "언어", "IDIOMA", "LANGUE", "SPRACHE", "ЯЗЫК", "NGÔN NGỮ"],
  groupTheme: ["主题", "THEME", "テーマ", "主題", "테마", "TEMA", "THÈME", "THEMA", "ТЕМА", "GIAO DIỆN"],
  groupConversation: ["对话", "CONVERSATION", "会話", "對話", "대화", "CONVERSACIÓN", "CONVERSATION", "GESPRÄCH", "ДИАЛОГ", "HỘI THOẠI"],
  groupButtons: ["按钮", "BUTTONS", "ボタン", "按鈕", "버튼", "BOTONES", "BOUTONS", "SCHALTFLÄCHEN", "КНОПКИ", "NÚT"],
  defaultSummarizeLabel: ["📝 总结全文", "📝 Summarize", "📝 要約", "📝 總結全文", "📝 요약", "📝 Resumir", "📝 Résumer", "📝 Zusammenfassen", "📝 Резюме", "📝 Tóm tắt"],
  defaultSummarizePrompt: ["请用中文总结这篇网页正文部分的核心内容", "Please summarize the core content of this web page in English", "このウェブページの本文の核心内容を日本語で要約してください", "請用繁體中文總結這篇網頁正文部分的核心內容", "이 웹페이지 본문의 핵심 내용을 한국어로 요약해주세요", "Por favor, resume el contenido principal de esta página web en español", "Veuillez résumer le contenu principal de cette page web en français", "Bitte fasse den Kerninhalt dieser Webseite auf Deutsch zusammen", "Пожалуйста, резюмируйте основное содержание этой веб-страницы на русском языке", "Vui lòng tóm tắt nội dung chính của trang web này bằng tiếng Việt"],
  defaultOutlineLabel: ["🎯 提炼要点", "🎯 Key Points", "🎯 ポイント抽出", "🎯 提煉要點", "🎯 핵심 정리", "🎯 Puntos clave", "🎯 Points clés", "🎯 Schlüsselpunkte", "🎯 Ключевые моменты", "🎯 Ý chính"],
  defaultOutlinePrompt: ["请提炼这篇网页正文部分的要点，以列表形式列出", "Please extract the key points from this web page and list them", "このウェブページの要点をリスト形式で抽出してください", "請提煉這篇網頁正文部分的要點，以列表形式列出", "이 웹페이지의 핵심 포인트를 목록 형식으로 추출해주세요", "Por favor, extrae los puntos clave de esta página web y enuméralos", "Veuillez extraire les points clés de cette page web et les lister", "Bitte extrahiere die wichtigsten Punkte dieser Webseite und liste sie auf", "Пожалуйста, выделите ключевые моменты этой веб-страницы и перечислите их", "Vui lòng rút trích các ý chính của trang web này và liệt kê chúng"],
  defaultTranslateLabel: ["🌐 翻译", "🌐 Translate", "🌐 翻訳", "🌐 翻譯", "🌐 번역", "🌐 Traducir", "🌐 Traduire", "🌐 Übersetzen", "🌐 Перевести", "🌐 Dịch"],
  defaultTranslatePrompt: ["请将这篇网页的正文部分翻译成中文", "Please translate the main content of this web page to English", "このウェブページの本文を日本語に翻訳してください", "請將這篇網頁的正文部分翻譯成繁體中文", "이 웹페이지의 본문을 한국어로 번역해주세요", "Por favor, traduce el contenido principal de esta página web al español", "Veuillez traduire le contenu principal de cette page web en français", "Bitte übersetze den Hauptinhalt dieser Webseite ins Deutsche", "Пожалуйста, переведите основное содержание этой веб-страницы на русский язык", "Vui lòng dịch nội dung chính của trang web này sang tiếng Việt"],
  newButtonLabel: ["新按钮", "New Button", "新規ボタン", "新按鈕", "새 버튼", "Nuevo botón", "Nouveau bouton", "Neuer Button", "Новая кнопка", "Nút mới"],
  languageLabel: ["语言", "Language", "言語", "語言", "언어", "Idioma", "Langue", "Sprache", "Язык", "Ngôn ngữ"],
  darkModeLabel: ["深色模式", "Dark Mode", "ダークモード", "深色模式", "다크 모드", "Modo oscuro", "Mode sombre", "Dunkelmodus", "Тёмная тема", "Chế độ tối"],

  // ---- New API parameters ----
  groupParameters: ["请求参数", "REQUEST PARAMETERS", "リクエストパラメータ", "請求參數", "요청 매개변수", "PARÁMETROS", "PARAMÈTRES", "ANFORDERUNGSPARAMETER", "ПАРАМЕТРЫ", "THAM SỐ"],
  streamOutputLabel: ["流式输出", "Streaming Output", "ストリーミング出力", "串流輸出", "스트리밍 출력", "Salida en streaming", "Sortie en streaming", "Streaming-Ausgabe", "Потоковый вывод", "Xuất phát trực tuyến"],
  streamOutputDesc: ["逐字显示 AI 回复内容。若 API 不支持流式，请关闭此选项", "Stream tokens as they are generated. Turn off for APIs that only support non-streaming responses", "トークンを生成しながら表示します。ストリーミング非対応のAPIではオフにしてください", "逐字顯示 AI 回覆內容。若 API 不支援串流，請關閉此選項", "토큰이 생성되는 대로 표시합니다. 스트리밍을 지원하지 않는 API는 끄세요", "Muestra los tokens a medida que se generan. Desactívelo para APIs que solo admiten respuestas no streaming", "Affiche les jetons au fur et à mesure. Désactivez pour les API sans streaming", "Token werden während der Generierung angezeigt. Für APIs ohne Streaming deaktivieren", "Отображать токены по мере генерации. Отключите для API без потоковой передачи", "Hiển thị token khi đang tạo. Tắt cho API chỉ hỗ trợ phản hồi không trực tuyến"],
  groupAdvanced: ["高级参数", "ADVANCED PARAMETERS", "詳細パラメータ", "高級參數", "고급 매개변수", "PARÁMETROS AVANZADOS", "PARAMÈTRES AVANCÉS", "ERWEITERTE PARAMETER", "РАСШИРЕННЫЕ ПАРАМЕТРЫ", "THAM SỐ NÂNG CAO"],
  temperatureLabel: ["温度", "Temperature", "温度", "溫度", "온도", "Temperatura", "Température", "Temperatur", "Температура", "Nhiệt độ"],
  temperatureDesc: ["控制输出的随机性，值越高越有创造力", "Controls randomness of output. Higher = more creative", "出力のランダム性を制御。高いほど創造的", "控制輸出的隨機性，值越高越有創造力", "출력의 무작위성을 제어합니다. 높을수록 창의적", "Controla la aleatoriedad. Más alto = más creativo", "Contrôle le caractère aléatoire. Plus haut = plus créatif", "Steuert die Zufälligkeit. Höher = kreativer", "Управляет случайностью вывода. Выше = креативнее", "Kiểm soát tính ngẫu nhiên. Cao hơn = sáng tạo hơn"],
  maxTokensLabel: ["最多 Token", "Max Tokens", "最大トークン数", "最多 Token", "최대 토큰", "Máx. de tokens", "Max de tokens", "Max. Tokens", "Макс. токенов", "Token tối đa"],
  maxTokensDesc: ["单次回复的最大 token 数", "Maximum tokens per response", "1回の応答あたりの最大トークン数", "單次回覆的最大 token 數", "응답당 최대 토큰 수", "Máximo de tokens por respuesta", "Nombre maximum de tokens par réponse", "Maximale Tokens pro Antwort", "Максимум токенов на ответ", "Token tối đa mỗi phản hồi"],
  reasoningLabel: ["推理深度", "Reasoning Depth", "推論深度", "推理深度", "추론 깊이", "Profundidad de razonamiento", "Profondeur de raisonnement", "Argumentationstiefe", "Глубина рассуждения", "Độ sâu suy luận"],
  reasoningDesc: ["控制模型的思考深度，部分模型自动适配", "Control the model\'s thinking depth. Auto-adapts per model", "モデルの思考深度を制御。モデルに応じて自動調整", "控制模型的思考深度，部分模型自動適配", "모델의 사고 깊이를 제어합니다. 모델별 자동 적용", "Controla la profundidad de pensamiento. Se adapta por modelo", "Contrôle la profondeur de réflexion. S\'adapte par modèle", "Steuert die Denktiefe. Pro Modell automatisch angepasst", "Управляет глубиной мышления. Автоподстройка по модели", "Kiểm soát độ sâu suy nghĩ. Tự động thích ứng theo mô hình"],
  topPDesc: ["核采样阈值，与温度互补", "Nucleus sampling threshold, complements temperature", "核サンプリングの閾値。温度と補完関係", "核採樣閾值，與溫度互補", "핵 샘플링 임계값. 온도와 보완 관계", "Umbral de muestreo nuclear, complementa la temperatura", "Seuil d\'échantillonnage nucléaire, complète la température", "Schwellenwert für Nucleus Sampling, ergänzt Temperatur", "Порог ядерной выборки, дополняет температуру", "Ngưỡng lấy mẫu hạt nhân, bổ sung cho nhiệt độ"],
  freqPenaltyLabel: ["频率惩罚", "Frequency Penalty", "頻度ペナルティ", "頻率懲罰", "빈도 패널티", "Penalización de frecuencia", "Pénalité de fréquence", "Frequenzstrafe", "Штраф за частоту", "Phạt tần suất"],
  freqPenaltyDesc: ["惩罚已出现过的 token，减少重复", "Penalizes repeated tokens", "既出トークンにペナルティを課し、繰り返しを減らす", "懲罰已出現過的 token，減少重複", "이미 나온 토큰에 패널티를 부과하여 반복 감소", "Penaliza tokens repetidos", "Pénalise les tokens déjà apparus, réduit les répétitions", "Bestraft wiederholte Tokens, reduziert Wiederholungen", "Штрафует повторяющиеся токены, уменьшает повторы", "Phạt các token đã xuất hiện, giảm lặp lại"],
  presPenaltyLabel: ["存在惩罚", "Presence Penalty", "存在ペナルティ", "存在懲罰", "존재 패널티", "Penalización de presencia", "Pénalité de présence", "Anwesenheitsstrafe", "Штраф за присутствие", "Phạt hiện diện"],
  presPenaltyDesc: ["鼓励模型谈论新主题，提高多样性", "Encourages the model to talk about new topics", "モデルが新しい話題を話すよう促し、多様性を向上", "鼓勵模型談論新主題，提高多樣性", "모델이 새로운 주제를 말하도록 유도, 다양성 향상", "Anima al modelo a hablar de temas nuevos", "Encourage le modèle à aborder de nouveaux sujets", "Ermutigt das Modell, über neue Themen zu sprechen", "Поощряет модель говорить о новых темах", "Khuyến khích mô hình nói về chủ đề mới"],
  stopSeqLabel: ["停止序列", "Stop Sequences", "停止シーケンス", "停止序列", "중지 시퀀스", "Secuencias de parada", "Séquences d\'arrêt", "Stopp-Sequenzen", "Стоп-последовательности", "Chuỗi dừng"],
  stopSeqDesc: ["逗号分隔，遇到这些序列时停止生成", "Comma-separated. Stops generation when encountered", "カンマ区切り。これらのシーケンスで生成を停止", "逗號分隔，遇到這些序列時停止生成", "쉼표로 구분. 이 시퀀스를 만나면 생성 중지", "Separado por comas. Detiene la generación al encontrarlos", "Séparés par des virgules. Arrête la génération à leur rencontre", "Komma-getrennt. Stoppt Generierung bei Fund", "Через запятую. Останавливает генерацию", "Phân cách bằng dấu phẩy. Dừng tạo khi gặp"],
  systemPromptLabel: ["自定义 System Prompt", "Custom System Prompt", "カスタム System Prompt", "自訂 System Prompt", "커스텀 System Prompt", "Prompt del sistema personalizado", "Invite système personnalisée", "Benutzerdefinierter System-Prompt", "Пользовательский системный промпт", "System Prompt tùy chỉnh"],
  systemPromptDesc: ["附加在自动生成的上下文提示之后", "Appended after the auto-generated context prompt", "自動生成されたコンテキストプロンプトの後に追加", "附加在自動生成的上下文提示之後", "자동 생성된 컨텍스트 프롬프트 뒤에 추가됨", "Se agrega después del prompt de contexto autogenerado", "Ajouté après l\'invite de contexte générée automatiquement", "Wird nach dem automatisch generierten Kontext-Prompt angehängt", "Добавляется после автоматически сгенерированного промпта контекста", "Được thêm vào sau prompt ngữ cảnh tự động tạo"],
  thinkingLabel: ["思考过程", "Thinking", "思考過程", "思考過程", "생각 과정", "Razonamiento", "Réflexion", "Denkprozess", "Размышление", "Quá trình suy nghĩ"],
  resetButton: ["重置所有设置", "Reset All Settings", "すべての設定をリセット", "重置所有設定", "모든 설정 초기화", "Restablecer configuración", "Réinitialiser tous les paramètres", "Alle Einstellungen zurücksetzen", "Сбросить все настройки", "Đặt lại tất cả cài đặt"],
  resetConfirm: ["确定要重置所有设置吗？此操作不可撤销。", "Reset all settings? This cannot be undone.", "すべての設定をリセットしますか？元に戻せません。", "確定要重置所有設定嗎？此操作不可撤銷。", "모든 설정을 초기화하시겠습니까? 취소할 수 없습니다.", "¿Restablecer todos los ajustes? No se puede deshacer.", "Réinitialiser tous les paramètres ? Impossible d'annuler.", "Alle Einstellungen zurücksetzen? Kann nicht rückgängig gemacht werden.", "Сбросить все настройки? Это действие нельзя отменить.", "Đặt lại tất cả cài đặt? Không thể hoàn tác."],
  resetHint: ["所有配置将恢复为默认值，不可撤销", "All settings will be restored to defaults. This cannot be undone.", "すべての設定がデフォルトに戻ります。元に戻せません。", "所有配置將恢復為預設值，不可撤銷", "모든 설정이 기본값으로 복원됩니다. 취소할 수 없습니다.", "Todos los ajustes volverán a los valores predeterminados. No se puede deshacer.", "Tous les paramètres seront restaurés aux valeurs par défaut. Cette action est irréversible.", "Alle Einstellungen werden auf Standard zurückgesetzt. Kann nicht rückgängig gemacht werden.", "Все настройки будут восстановлены по умолчанию. Это действие нельзя отменить.", "Tất cả cài đặt sẽ được khôi phục về mặc định. Không thể hoàn tác."],
};


const LANGUAGES = [
  { code: 'zh_CN', label: '中文' },
  { code: 'zh_TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: 'Русский' },
  { code: 'vi', label: 'Tiếng Việt' },
];

// 获取当前语言代码
function detectLanguage() {
  const nav = (navigator.language || '').replace('-', '_');
  if (nav.startsWith('zh')) return nav.startsWith('zh_TW') || nav.startsWith('zh_HK') || nav.startsWith('zh_MO') ? 'zh_TW' : 'zh_CN';
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('ko')) return 'ko';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('fr')) return 'fr';
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('vi')) return 'vi';
  return 'en';
}

// ---- 语言存储读写 ----
function getStoredLanguage(callback) {
  chrome.storage.sync.get('language', (result) => {
    callback(result.language || null);
  });
}

function setStoredLanguage(code, callback) {
  chrome.storage.sync.set({ language: code }, callback);
}

// ---- 核心 t() 函数 ----
function t(key, ...args) {
  const lang = window.__dp_lang || detectLanguage();
  const idx = LANG_CODES.indexOf(lang);
  if (idx === -1) return key;
  const arr = TRANSLATIONS[key];
  if (!arr) return key;
  let text = arr[idx];
  if (!text) return key;
  args.forEach((arg, i) => {
    text = text.replace(new RegExp('\\$' + (i + 1), 'g'), arg);
  });
  return text;
}

// ---- 异步加载语言 ----
function loadLanguage(callback) {
  getStoredLanguage((stored) => {
    window.__dp_lang = stored || detectLanguage();
    if (callback) callback(window.__dp_lang);
  });
}

// ---- 获取当前语言 ----
function getCurrentLang() {
  return window.__dp_lang || detectLanguage();
}
