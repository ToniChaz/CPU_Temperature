// ===============================================
// CPU temrerature
// to see logs journalctl /usr/bin/gnome-session -f
// ===============================================
// http://smasue.github.io/gnome-shell-tw
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
// const Me = imports.misc.extensionUtils.getCurrentExtension();
// const Utilities = Me.imports.utilities;

let text, button, cpuTimeout, btnLabel, resultToString;

function _hideModal() {
  Main.uiGroup.remove_actor(text);
  text = null;
}

function _showModal() {
  if (!text) {
    text = new St.Label({ style_class: 'modal', text: resultToString || 'No data' });
    Main.uiGroup.add_actor(text);
  }

  text.opacity = 255;

  let monitor = Main.layoutManager.primaryMonitor;

  text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
    monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

  Tweener.addTween(text,
    { opacity: 155,
      time: 10,
      transition: 'easeOutQuad',
      onComplete: _hideModal });
}

function _detectSensors() {
  let path = GLib.find_program_in_path('sensors');
  return path || null;
}

function _refresh () {
  if (cpuTimeout) {
    Mainloop.source_remove(cpuTimeout);
    cpuTimeout = null;
  }

  _getTemperature();

  // the refresh function will be called every 2 sec.
  cpuTimeout = Mainloop.timeout_add_seconds(2, _refresh);
}

function _getTemperature(){
  let sensorsArgv = _detectSensors();
  let tempInfo = 'No sensors';

  if (sensorsArgv){
    // let systemctl = GLib.find_program_in_path('systemctl');
    let result = GLib.spawn_command_line_sync('sensors');
    if(result[0]){
      resultToString = result[1].toString();
      let regexp = /CPU:\s+\+[0-9|.]+../g;
      let match = regexp.exec(resultToString);
      tempInfo = match[0].replace(/ /g,'').replace('+', '').replace('CPU:','');
    }
  }

  btnLabel.set_text(tempInfo)
}

function _init(){
  _getTemperature();
  _refresh();
}

function init() {
  button = new St.Bin({ style_class: 'panel-button',
    reactive: true,
    can_focus: true,
    x_fill: true,
    y_fill: false,
    track_hover: true });
  // let icon = new St.Icon({ icon_name: 'gnome-foot',
  //   style_class: 'gnome-foot' });

  btnLabel = new St.Label({style_class: 'button-text', text: 'No data'});

  button.set_child(btnLabel);
  button.connect('button-press-event', _showModal);

  _init();
}

function enable() {
  Main.panel._rightBox.insert_child_at_index(button, 0);
  _init();
}

function disable() {
  Main.panel._rightBox.remove_child(button);
  if (cpuTimeout) {
    Mainloop.source_remove(cpuTimeout);
    cpuTimeout = null;
  }
}
