{
  "use strict";

  let last_type = "_All";

  const images = {
    fan: "../pics/vent.png",
    lock_open: "../pics/lock_open.png",
    lock_closed: "../pics/lock_closed.png",
    lamp_on: "../pics/lamp2_on.jpg",
    lamp_off: "../pics/lamp2_off.jpg",
    blinds: "../pics/blinds.png",
    unknown: "../pics/default.png",
    add: "../pics/plus.png",
    home: "../pics/home.jpeg",
    loading: "../pics/loading5.png"
  };

  let type_icons = {
    Lamp: images.lamp_off,
    Fan: images.fan,
    Blinds: images.blinds,
    Lock: images.lock_closed,
    unknown: images.unknown
  };

  const default_content = [
    {name : "TV LED", type : "Lamp", data : {status: {value: 1, min: 0, max: 1}, hue: 22, lightness: 50}},
    {name : "Ceiling Light", type : "Lamp", data : {status: {value: 0, min: 0, max: 1}, hue: 233, lightness: 100}},
    {name : "Ceiling Fan", type : "Fan", data : {status: {value: 1, min: 0, max: 4}}},
    {name : "Desk Fan", type : "Fan", data : {status: {value: 0, min: 0, max: 1}}},
    {name : "Bedroom Blinds", type : "Blinds", data : {status: {value: 70, min: 0, max: 100, step: 10}}},
    {name : "Front Door", type : "Lock", data : {status: {value: 1, min: 0, max: 1}}},
    // {name : "ErrTester", type : "//", data : {reason : "??", "<for real>" : "WTF"}},
    {name : "Kitchen Blinds", type : "Blinds", data : {status: {value: 50, min: 0, max: 100, step: 25}}}
  ];

  let gadgets = [];

  let load_landing_content = () => {
    console.log("[INFO] Loading landing content.");
    let main = document.getElementById('main-content');
    document.getElementById('body').className = "landing_page";
    deleteAllChildren(main);

    let new_img = document.createElement("img");
    new_img.src = images.loading;

    new_img.addEventListener (
      'click',
      function() {
        refreshMainContent();
        refreshNavContent();
        },
      false);

    main.appendChild(new_img);
  };

  let load_external_content = () => {
    const url = "localhost:5666";
    const req_data = {
      headers: {
        "accept": "application/json"
      },
      method: "GET"
    };

    console.log("[INFO] Fetching external Data.");
    try {
      fetch(url, req_data)
        .then(data => {
          console.log("  => Data fetched successfull.");
          gadgets = JSON.load(data);
          refreshMainContent(last_type);
          // loadNavigation();
        })
        .catch(error => {
          console.log("  => Connection failed.");
          gadgets = JSON.parse(JSON.stringify(default_content));
          // loadNavigation();
        })
    }
    catch (error) {
      console.log("  => Something went completely wrong.");
    }
  };

  let generateDOMElement = (gadget) => {
    console.log(`  => Creating ${gadget.type} "${gadget.name}"`);

    let newdiv = document.createElement("div");

    let attribute_container = document.createElement("article");

    let get_val = (val) => {
      if (typeof val === 'object' && val !== null) {
        return val.value;
      }
      return val;
    };

    let get_min = () => {
      if (gadget.data.status.min !== undefined) {
        return gadget.data.status.min;
      }
      return 0;
    };

    let get_max = () => {
      if (gadget.data.status.max !== undefined) {
        return gadget.data.status.max;
      }
      return 1;
    };

    let get_step = () => {
      if (gadget.data.status.step !== undefined) {
        return gadget.data.status.step;
      }
      return 1;
    };

    let modify_status = (gadget) => {
      console.log(`[INFO] Modifying Status of '${gadget.name}'`);
      if (gadget.data.status !== undefined) {
        let val = get_val(gadget.data.status);

        let min  = get_min();
        let max  = get_max();
        let step = get_step();

        if (val < max) {
          val += step;
          if (val > max) {
            val = max;
          }
        } else {
          val = min;
        }

        console.log(`  => Switching Status from ${get_val(gadget.data.status)} to ${val}`);

        if (typeof gadget.data.status === 'object' && gadget.data.status !== null) {
          gadget.data.status.value = val;
        } else {
          gadget.data.status = val;
        }
      }
    };

    let refresh_data_section = (data, container) => {
      deleteAllChildren(container);
      for (let attribute in data) {
        let line = document.createElement("p");
        let value = get_val(data[attribute]);
        line.appendChild(document.createTextNode(`${attribute} : ${value}`));
        container.appendChild(line);
      }
    };

    refresh_data_section(gadget.data, attribute_container);

    let new_img = document.createElement("img");

    new_img.addEventListener (
      'click',
      function() {
        modify_status(gadget);
        // refresh_data_section(gadget.data, attribute_container);
        refreshMainContent();
        },
      false);

    switch (gadget.type) {
      case "Lamp":
        if (get_val(gadget.data.status) > 0) {
          new_img.src = images.lamp_on;
        } else {
          new_img.src = images.lamp_off;
        }
        break;
      case "Fan":
        new_img.src = images.fan;
        if (get_val(gadget.data.status) > 0) {
          new_img.className = "fan_on";
        } else {
          new_img.className = "fan_off";
        }
        break;
      case "Blinds":
        new_img.src = images.blinds;
        break;
      case "Lock":
        if (get_val(gadget.data.status) === 1) {
          new_img.src = images.lock_open;
        } else {
          new_img.src = images.lock_closed;
        }
        break;
      default:
        new_img.src = images.unknown;
        break;
    }

    let headline = document.createElement("h2");
    headline.appendChild(document.createTextNode(gadget.name));

    newdiv.appendChild(headline);

    newdiv.appendChild(new_img);

    newdiv.appendChild(attribute_container);

    return newdiv;
  };

  function deleteAllChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  let getAllGadgetTypes = () => {
    let allTypes = [];
    for (let gadget of gadgets) {
      if (!allTypes.includes(gadget.type)) {
        allTypes.push(gadget.type)
      }
    }
    return allTypes;
  };

  let loadGadgets = (type) => {
    let used_gadgets = [];
    if (type === "_All" || type === undefined || type === null) {
      used_gadgets = gadgets;
    } else {
      for (let gadget of gadgets) {
        if (gadget.type === type) {
          used_gadgets.push(gadget);
        }
      }
    }
    console.log(`[INFO] Lade ${used_gadgets.length} von ${gadgets.length} Elementen`);
    let main = document.getElementById('main-content');
    document.getElementById('body').className = "gadget_view";
    for (let gadget of used_gadgets) {
      let DOMGadget = generateDOMElement(gadget);
      main.appendChild(DOMGadget);
    }
  };

  let loadNavigation = () => {
    let types = getAllGadgetTypes();
    let navbar = document.getElementById('navigation-content');
    console.log(`[INFO] Lade Navigation mit ${types.length} Gadget-Typen + 'All' + 'Add'`);

    // Add new Gadget
    let add_gadget = document.createElement("li");
    let add_div = document.createElement("div");
    add_div.addEventListener (
      'click',
      function() { refreshMainContent("_Add"); },
      false);

    let add_text = document.createElement("p");
    add_text.textContent = "Add Gadget";
    let add_img = document.createElement("img");
    add_img.src = images.add;

    add_div.appendChild(add_img);
    add_div.appendChild(add_text);
    add_gadget.appendChild(add_div);
    navbar.appendChild(add_gadget);

    // Home-Menu / All Gadgets
    let all_gadget = document.createElement("li");
    let all_div = document.createElement("div");
    all_div.addEventListener (
      'click',
      function() { refreshMainContent("_All"); },
      false);

    let all_text = document.createElement("p");
    all_text.textContent = "Home";
    let all_img = document.createElement("img");
    all_img.src = images.home;

    all_div.appendChild(all_img);
    all_div.appendChild(all_text);
    all_gadget.appendChild(all_div);
    navbar.appendChild(all_gadget);


    for (let type of types) {
      let entry = document.createElement("li");
      let type_div = document.createElement("div");

      let type_icon = document.createElement("img");
      if (type_icons[type] !== undefined) {
        type_icon.src = type_icons[type];
      } else {
        type_icon.src = type_icons.unknown;
      }
      type_div.appendChild(type_icon);

      let type_text = document.createElement("p");
      type_text.textContent = type;

      type_div.appendChild(type_text);
      type_div.addEventListener (
        'click',
        function() { refreshMainContent(type); },
        false);
      entry.appendChild(type_div);
      navbar.appendChild(entry);
    }
  };

  let addGadgetView = () => {
    console.log("[INFO] Zeige 'Add Gadget'-View");
    let main = document.getElementById('main-content');
    document.getElementById('body').className = "add_gadget_view";

    let form = document.createElement("form");


    let basic_fieldset = document.createElement("fieldset");
    let basic_legend = document.createElement("legend");
    basic_legend.textContent = "Basic Data";
    basic_fieldset.appendChild(basic_legend);


    // Name-Feld
    let name_div = document.createElement("div");
    let label = document.createElement("label");
    label.setAttribute("for", "inp_name");
    label.appendChild(document.createTextNode("Name: "));

    let input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("id", "inp_name");

    name_div.appendChild(label);
    name_div.appendChild(input);


    // Type-Auswahl
    let type_sel_div = document.createElement("div");
    let type_sel_input = document.createElement("input");
    type_sel_input.setAttribute("id", "inp_type");
    type_sel_input.setAttribute("type", "search");
    type_sel_input.setAttribute("list", "allGadgets");

    let type_sel_label = document.createElement("label");
    type_sel_label.setAttribute("for", "inp_type");
    type_sel_label.textContent = "Category: ";

    let gadget_list = document.createElement("datalist");
    gadget_list.setAttribute("id", "allGadgets");

    for (let type of getAllGadgetTypes()) {
      let list_entry = document.createElement("option");
      list_entry.setAttribute("value", type);
      gadget_list.appendChild(list_entry);
    }

    type_sel_div.appendChild(type_sel_label);
    type_sel_div.appendChild(type_sel_input);
    type_sel_div.appendChild(gadget_list);


    //ID-Auswahl
    let id_sel_div = document.createElement("div");
    let id_sel_input = document.createElement("input");
    id_sel_input.setAttribute("id", "inp_id");
    id_sel_input.setAttribute("type", "number");
    id_sel_input.setAttribute("min", "0");
    id_sel_input.setAttribute("max", "999999999");

    let id_sel_label = document.createElement("label");
    id_sel_label.setAttribute("for", "inp_id");
    id_sel_label.textContent = "ID: ";

    id_sel_div.appendChild(id_sel_label);
    id_sel_div.appendChild(id_sel_input);


    basic_fieldset.appendChild(name_div);
    basic_fieldset.appendChild(id_sel_div);
    basic_fieldset.appendChild(type_sel_div);


    // Attribute-Eingabe
    let attr_fieldset = document.createElement("fieldset");
    let attr_legend = document.createElement("legend");
    attr_legend.textContent = "Attributes (JSON)";
    attr_fieldset.appendChild(attr_legend);

    let attr_div = document.createElement("div");

    let attr_input = document.createElement("textarea");
    attr_input.setAttribute("cols", "25");
    attr_input.setAttribute("rows", "15");
    attr_input.setAttribute("id", "attributes_text");

    attr_div.appendChild(attr_input);
    attr_fieldset.appendChild(attr_div);

    //Buttons
    let btn_fieldset = document.createElement("fieldset");
    let btn_legend = document.createElement("legend");
    btn_legend.textContent = "Actions";
    btn_fieldset.appendChild(btn_legend);

    let submit_btn = document.createElement('input');
    // submit_btn.addEventListener("click", checkForm, false);
    submit_btn.setAttribute('type','submit');
    submit_btn.setAttribute('name','Create Gadget');
    submit_btn.setAttribute('value','Create Gadget');
    btn_fieldset.appendChild(submit_btn);

    let reset_btn = document.createElement('input');
    reset_btn.setAttribute('type','reset');
    reset_btn.setAttribute('name','Reset Form');
    reset_btn.setAttribute('value','Reset Form');
    btn_fieldset.appendChild(reset_btn);

    //Status
    let status_fieldset = document.createElement("fieldset");
    let status_legend = document.createElement("legend");
    status_legend.textContent = "Status";
    status_fieldset.appendChild(status_legend);
    let status_p = document.createElement("p");
    status_p.setAttribute("id", "p_status");
    status_p.textContent = "";
    status_fieldset.appendChild(status_p);


    //Local Helper Functions
    let setStatusMsg = (status) => {
      let status_p = document.getElementById("p_status");
      if (status_p !== undefined && status_p !== null) {
        if (status !== undefined && status !== null) {
          status_p.textContent = status;
        } else {
          status_p.textContent = "";
        }
      }
    };

    let checkForm = (e) => {
      e.preventDefault();
      // const form = document.querySelector('form');
      let f_name = document.getElementById("inp_name").value;
      let f_typ = document.getElementById("inp_type").value;
      let f_id = document.getElementById("inp_id").value;
      let f_data;
      try {
        f_data = JSON.parse(document.getElementById("attributes_text").value);
      } catch (error) {
        f_data = {};
      }
      let uncompleted_fields = [];
      if (f_name === "" || f_name === undefined) {
        uncompleted_fields.push("Name");
      }
      if (f_typ === "" || f_typ === undefined) {
        uncompleted_fields.push("Category");
      }
      if (f_id === "" || f_id === undefined) {
        uncompleted_fields.push("ID");
      }

      if (uncompleted_fields.length === 0) {
        console.log("[INFO] Data submitted.");
        let new_gadget = {name: f_name, id: f_id, type: f_typ, data: f_data};
        gadgets.push(new_gadget);

        refreshNavContent();
        form.reset();
        setStatusMsg(`${f_typ} '${f_name}' created.`);
      } else {
        let missing_fields_str = "";
        for (let name of uncompleted_fields) {
          if (missing_fields_str !== "") {
            missing_fields_str += ", ";
          }
          missing_fields_str += name;
        }
        console.log(`[WARN] Data not complete: [${missing_fields_str}]`);
        setStatusMsg(`There Are Fields uncompleted: ${missing_fields_str}`);
      }
    };

    //Form Event-Listener
    form.addEventListener('submit', checkForm, false);


    //Appending Stuff to DOM
    form.appendChild(basic_fieldset);
    form.appendChild(attr_fieldset);
    form.appendChild(btn_fieldset);
    form.appendChild(status_fieldset);

    main.appendChild(form);
  };

  let refreshNavContent = () => {
    let nav = document.getElementById('navigation-content');
    deleteAllChildren(nav);
    loadNavigation();
  };

  let refreshMainContent = (type) => {
    if (type === undefined) {
      type = last_type;
    } else {
      last_type = type;
    }
    let main = document.getElementById('main-content');
    deleteAllChildren(main);
    if (type === "_Add") {
      addGadgetView();
    } else {
      loadGadgets(type);
    }
  };

  let pageLoaded = (e) => {
    console.log("[INFO] Page Loaded");
    load_landing_content();
    load_external_content();
    // refreshMainContent();
  };

  let DOMLoaded = (e) => {
    console.log("[INFO] DOMContentLoaded");
  };

  window.addEventListener("load", pageLoaded,false);
  window.addEventListener("DOMContentLoaded", DOMLoaded,false);
}
