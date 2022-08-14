module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],

  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    resolve: {
      // add the fallback setting below 
      fallback: {
        "fs": false,
        "os": false,
        "path": false
      }
    }
  }
}
