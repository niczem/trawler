module.exports = [
  {
    identifier: 'url',
    fields: [
      {
        name: 'identifier',
        title: 'Identifier(s)',
        type: 'text',
      },
      {
        name: 'result_type',
        title: 'Type',
        type: 'select',
        options: {
          1: 'json',
        },
      },
      {
        name: 'url',
        title: 'URL',
        type: 'text',
      },
      {
        name: 'pagination',
        title: 'Pagination',
        type: 'select',
        options: {
          true: 'yes',
          false: 'no',
        },
      },
      {
        name: 'pagination_min',
        title: 'Pagination Minimum (usually 0 or 1)',
        type: 'number',
      },
      {
        name: 'pagination_max',
        title: 'Pagination Maximum',
        type: 'number',
      },
      {
        name: 'increase_by',
        title: 'Increase page by (e.g. 1 or 50 or 100)',
        type: 'number',
      },
      {
        name: 'authorization_header',
        title: 'Authorization Header',
        type: 'text',
      },
      {
        name: 'result_is_array',
        title: 'Result is array (paginated results will be merged)',
        type: 'select',
        options: {
          true: 'yes',
          false: 'no',
        },
      },
      {
        name: 'result_index',
        title:
          'Result Index (array index or object index in which the results are stored)',
        type: 'text',
      },
    ],
  },
];
