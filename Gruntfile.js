module.exports = function(grunt) {
  grunt.initConfig({
    loopback_sdk_angular: {
      services: {
        options: {
          input: 'server/server.js',
          output: 'client/js/services/lb-services.js'
        }
      }
    },
    docular: {
      groups: [
        {
          groupTitle: 'LoopBack',
          groupId: 'loopback',
          sections: [
            {
              id: 'lbServices',
              title: 'LoopBack Services',
              scripts: [ 'client/js/services/lb-services.js' ]
            }
          ]
        }
      ]
    },
    docularserver: {
      targetDir: 'docular_generated'
    },
    ngtemplates: {
      app: {
        options: {
          //prefix: '/',
          htmlmin:  {
            collapseWhitespace: true,
            collapseBooleanAttributes: true
          }
        },
        cwd:      'client/views',
        src:      '**.html',
        dest:     'client/js/tmpls.js'
      }
    },

    watch: {
      tmpls: {
        files: ['client/views/**.html'],
        tasks: ['ngtemplates'],
        options: {
          //spawn: false,
        },
      },
      ctrls: {
        files: ['client/js/controllers/**.js', 'client/js/controllers/ad/**.js'],
        tasks: ['ngAnnotate']
      }
    },


    ngAnnotate: {
        options: {
            singleQuotes: true,
            //separator: ';'
        },
        ctrls: {
            files: {
                'client/js/ctrls.js': ['client/js/controllers/**.js', 'client/js/controllers/ad/**.js'],
            },
        }
    }



  });

  //ng-annotate for js
  grunt.loadNpmTasks('grunt-ng-annotate');
  //watch
  grunt.loadNpmTasks('grunt-contrib-watch');
  //templateCash
  grunt.loadNpmTasks('grunt-loopback-sdk-angular');
  // Load the plugin that provides the "loopback-sdk-angular" and "grunt-docular" tasks.
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-docular');
  // this is alternative for way to call 'lb-ng-doc client/js/services/lb-services.js'
  grunt.registerTask('serve', ['docularserver']);

  // Default task(s).
  grunt.registerTask('angular-sdk', ['docular', 'serve']);
  grunt.registerTask('build', ['ngtemplates', 'ngAnnotate']);
  grunt.registerTask('start', ['build', 'watch']);//'watch:tmpls', 'watch:ctrls'

};
