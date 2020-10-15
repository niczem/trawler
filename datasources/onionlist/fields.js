module.exports = [
  {
    identifier: 'onionlist_pages',
    fields: [
      {
        name: 'category',
        title: 'Category',
        type: 'select',
        options: {
          1: '1/markets',
          2: '2/financial',
          3: '3/communication',
          4: '4/services',
          5: '5/wiki',
          6: '6/social',
          7: '7/other',
        },
      },
      {
        name: 'limit',
        title: 'Limit',
        type: 'number',
        step: 1,
      },
    ],
  },
];
