
module.exports = {
  apps : [
      {
        name: 'abs-backend',
        script: './app.js',
        interpreter_args: '--max-old-space-size=8192',
    }
  ],
};

