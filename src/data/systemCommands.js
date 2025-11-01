/**
 * Команды терминала для Windows 11 Web OS
 */

export const getSystemCommands = (lm) => ({
  help: {
    description: lm.getString('cmd_help_desc', 'Show list of available commands'),
    usage: 'help [command]',
    examples: ['help', 'help ls']
  },
  
  ls: {
    description: lm.getString('cmd_ls_desc', 'List content of the current folder'),
    usage: 'ls [path]',
    examples: ['ls', 'ls Desktop']
  },
  
  dir: {
    description: lm.getString('cmd_dir_desc', 'List content of the current folder (alias for ls)'),
    usage: 'dir [path]',
    examples: ['dir', 'dir Documents']
  },
  
  cd: {
    description: lm.getString('cmd_cd_desc', 'Change current directory'),
    usage: 'cd <path>',
    examples: ['cd Desktop', 'cd ..', 'cd /']
  },
  
  pwd: {
    description: lm.getString('cmd_pwd_desc', 'Show current path'),
    usage: 'pwd',
    examples: ['pwd']
  },
  
  mkdir: {
    description: lm.getString('cmd_mkdir_desc', 'Create a new folder'),
    usage: 'mkdir <name>',
    examples: ['mkdir NewFolder', 'mkdir "My Folder"']
  },
  
  touch: {
    description: lm.getString('cmd_touch_desc', 'Create a new file'),
    usage: 'touch <name>',
    examples: ['touch file.txt', 'touch "my file.txt"']
  },
  
  rm: {
    description: lm.getString('cmd_rm_desc', 'Delete a file or folder'),
    usage: 'rm <name>',
    examples: ['rm file.txt', 'rm folder']
  },
  
  cat: {
    description: lm.getString('cmd_cat_desc', 'Show content of a file'),
    usage: 'cat <filename>',
    examples: ['cat file.txt']
  },
  
  echo: {
    description: lm.getString('cmd_echo_desc', 'Print text'),
    usage: 'echo <text>',
    examples: ['echo Hello World', 'echo "Hello World"']
  },
  
  clear: {
    description: lm.getString('cmd_clear_desc', 'Clear the terminal screen'),
    usage: 'clear',
    examples: ['clear']
  },
  
  cls: {
    description: lm.getString('cmd_cls_desc', 'Clear the terminal screen (alias for clear)'),
    usage: 'cls',
    examples: ['cls']
  },
  
  mv: {
    description: lm.getString('cmd_mv_desc', 'Move or rename a file/folder'),
    usage: 'mv <source> <destination>',
    examples: ['mv file.txt newfile.txt', 'mv file.txt Desktop/']
  },
  
  cp: {
    description: lm.getString('cmd_cp_desc', 'Copy a file or folder'),
    usage: 'cp <source> <destination>',
    examples: ['cp file.txt copy.txt', 'cp file.txt Desktop/']
  },
  
  find: {
    description: lm.getString('cmd_find_desc', 'Find files by name'),
    usage: 'find <query>',
    examples: ['find file', 'find *.txt']
  },
  
  date: {
    description: lm.getString('cmd_date_desc', 'Show current date and time'),
    usage: 'date',
    examples: ['date']
  },
  
  whoami: {
    description: lm.getString('cmd_whoami_desc', 'Show current user'),
    usage: 'whoami',
    examples: ['whoami']
  },
  
  ver: {
    description: lm.getString('cmd_ver_desc', 'Show system version'),
    usage: 'ver',
    examples: ['ver']
  },
  
  exit: {
    description: lm.getString('cmd_exit_desc', 'Close the terminal'),
    usage: 'exit',
    examples: ['exit']
  }
});

/**
 * Получение информации о команде
 * @param {string} command - Имя команды
 * @returns {Object|null} Информация о команде
 */
export function getCommandInfo(command, languageManager) {
  const commands = getSystemCommands(languageManager);
  return commands[command] || null;
}

/**
 * Получение списка всех команд
 * @returns {Array} Массив имен команд
 */
export function getAllCommands(languageManager) {
  const commands = getSystemCommands(languageManager);
  return Object.keys(commands);
}



