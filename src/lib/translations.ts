export type Language = 'en' | 'zh';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    manage: string;
    title: string;
  };
  
  // Home page
  home: {
    welcome: string;
    subtitle: string;
    createFirst: string;
    bookmarks: string;
    bookmark: string;
    newCollection: string;
    clickToCreate: string;
  };
  
  // Bookmark form
  form: {
    addBookmark: string;
    editBookmark: string;
    url: string;
    urlPlaceholder: string;
    title: string;
    titlePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    tags: string;
    addTag: string;
    pinToTop: string;
    saveTo: string;
    updateBookmark: string;
    cancel: string;
    loading: string;
    urlRequired: string;
    titleRequired: string;
    invalidUrl: string;
  };
  
  // Management interface
  manage: {
    noCollections: string;
    noCollectionsDesc: string;
    createFirstCollection: string;
    addBookmark: string;
    search: string;
    allTags: string;
    pinned: string;
    allBookmarks: string;
    gridView: string;
    listView: string;
    sortBy: string;
    sortByCreated: string;
    sortByUpdated: string;
    sortByTitle: string;
    sortByOrder: string;
    ascending: string;
    descending: string;
  };
  
  // Collection
  collection: {
    collection: string;
    collections: string;
    newCollection: string;
    editCollection: string;
    deleteCollection: string;
    name: string;
    icon: string;
    color: string;
    create: string;
    update: string;
    delete: string;
    nameRequired: string;
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    confirm: string;
    yes: string;
    no: string;
    edit: string;
    delete: string;
    save: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    sort: string;
    noResults: string;
  };
  
  // Messages
  messages: {
    bookmarkAdded: string;
    bookmarkUpdated: string;
    bookmarkDeleted: string;
    collectionAdded: string;
    collectionUpdated: string;
    collectionDeleted: string;
    confirmDeleteBookmark: string;
    confirmDeleteCollection: string;
  };

  // Stats
  stats: {
    totalCollections: string;
    totalBookmarks: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      manage: 'Manage',
      title: 'Shelf - 3D Bookmark Manager',
    },
    
    home: {
      welcome: 'Welcome to Shelf',
      subtitle: 'Create your first collection to start organizing your bookmarks in beautiful 3D stacks.',
      createFirst: 'Create Collection',
      bookmarks: 'bookmarks',
      bookmark: 'bookmark',
      newCollection: 'New Collection',
      clickToCreate: 'Click to create',
    },
    
    form: {
      addBookmark: 'Add New Bookmark',
      editBookmark: 'Edit Bookmark',
      url: 'URL *',
      urlPlaceholder: 'https://example.com',
      title: 'Title *',
      titlePlaceholder: 'Enter bookmark title',
      description: 'Description',
      descriptionPlaceholder: 'Optional description',
      tags: 'Tags',
      addTag: 'Add tag',
      pinToTop: 'Pin to top of collection',
      saveTo: 'Save to:',
      updateBookmark: 'Update Bookmark',
      cancel: 'Cancel',
      loading: 'Loading...',
      urlRequired: 'URL is required',
      titleRequired: 'Title is required',
      invalidUrl: 'Please enter a valid URL',
    },
    
    manage: {
      noCollections: 'No Collections Yet',
      noCollectionsDesc: 'Create your first collection to start managing your bookmarks.',
      createFirstCollection: 'Create First Collection',
      addBookmark: 'Add Bookmark',
      search: 'Search bookmarks...',
      allTags: 'All Tags',
      pinned: 'Pinned Only',
      allBookmarks: 'All Bookmarks',
      gridView: 'Grid View',
      listView: 'List View',
      sortBy: 'Sort by',
      sortByCreated: 'Created Date',
      sortByUpdated: 'Updated Date',
      sortByTitle: 'Title',
      sortByOrder: 'Order',
      ascending: 'Ascending',
      descending: 'Descending',
    },
    
    collection: {
      collection: 'Collection',
      collections: 'Collections',
      newCollection: 'New Collection',
      editCollection: 'Edit Collection',
      deleteCollection: 'Delete Collection',
      name: 'Name',
      icon: 'Icon',
      color: 'Color',
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      nameRequired: 'Collection name is required',
    },
    
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      noResults: 'No results found',
    },
    
    messages: {
      bookmarkAdded: 'Bookmark added successfully',
      bookmarkUpdated: 'Bookmark updated successfully',
      bookmarkDeleted: 'Bookmark deleted successfully',
      collectionAdded: 'Collection added successfully',
      collectionUpdated: 'Collection updated successfully',
      collectionDeleted: 'Collection deleted successfully',
      confirmDeleteBookmark: 'Are you sure you want to delete this bookmark?',
      confirmDeleteCollection: 'Are you sure you want to delete this collection? All bookmarks in it will also be deleted.',
    },

    stats: {
      totalCollections: 'Total Collections',
      totalBookmarks: 'Total Bookmarks',
    },
  },
  
  zh: {
    nav: {
      home: '首页',
      manage: '管理',
      title: 'Shelf - 3D书签管理器',
    },
    
    home: {
      welcome: '欢迎使用 Shelf',
      subtitle: '创建您的第一个合集，开始将书签整理成美丽的3D堆叠。',
      createFirst: '创建合集',
      bookmarks: '个书签',
      bookmark: '个书签',
      newCollection: '新建合集',
      clickToCreate: '点击创建',
    },
    
    form: {
      addBookmark: '添加新书签',
      editBookmark: '编辑书签',
      url: '网址 *',
      urlPlaceholder: 'https://example.com',
      title: '标题 *',
      titlePlaceholder: '输入书签标题',
      description: '描述',
      descriptionPlaceholder: '可选描述',
      tags: '标签',
      addTag: '添加标签',
      pinToTop: '置顶到合集顶部',
      saveTo: '保存到：',
      updateBookmark: '更新书签',
      cancel: '取消',
      loading: '加载中...',
      urlRequired: '网址为必填项',
      titleRequired: '标题为必填项',
      invalidUrl: '请输入有效的网址',
    },
    
    manage: {
      noCollections: '暂无合集',
      noCollectionsDesc: '创建您的第一个合集来开始管理书签。',
      createFirstCollection: '创建第一个合集',
      addBookmark: '添加书签',
      search: '搜索书签...',
      allTags: '所有标签',
      pinned: '仅显示置顶',
      allBookmarks: '所有书签',
      gridView: '网格视图',
      listView: '列表视图',
      sortBy: '排序方式',
      sortByCreated: '创建时间',
      sortByUpdated: '更新时间',
      sortByTitle: '标题',
      sortByOrder: '排序',
      ascending: '升序',
      descending: '降序',
    },
    
    collection: {
      collection: '合集',
      collections: '合集',
      newCollection: '新建合集',
      editCollection: '编辑合集',
      deleteCollection: '删除合集',
      name: '名称',
      icon: '图标',
      color: '颜色',
      create: '创建',
      update: '更新',
      delete: '删除',
      nameRequired: '合集名称为必填项',
    },
    
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      confirm: '确认',
      yes: '是',
      no: '否',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      close: '关闭',
      back: '返回',
      next: '下一页',
      previous: '上一页',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      noResults: '未找到结果',
    },
    
    messages: {
      bookmarkAdded: '书签添加成功',
      bookmarkUpdated: '书签更新成功',
      bookmarkDeleted: '书签删除成功',
      collectionAdded: '合集添加成功',
      collectionUpdated: '合集更新成功',
      collectionDeleted: '合集删除成功',
      confirmDeleteBookmark: '确定要删除这个书签吗？',
      confirmDeleteCollection: '确定要删除这个合集吗？其中的所有书签也将被删除。',
    },

    stats: {
      totalCollections: '合集总数',
      totalBookmarks: '书签总数',
    },
  },
};

export const getTranslation = (language: Language): Translations => {
  return translations[language] || translations.en;
};