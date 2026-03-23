import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import logo from "./logo.png";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [mesActual, setMesActual] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [editIndex, setEditIndex] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    nacimiento: "",
    categoria: "Mini Voley",
    genero: "Damas",
  });

  // Cargar
  useEffect(() => {
    const data = localStorage.getItem("players");
    if (data) setPlayers(JSON.parse(data));
  }, []);

  // Guardar
  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  // AGREGAR / EDITAR
  const guardarJugador = () => {
    if (!form.nombre || !form.apellido) return;

    if (editIndex !== null) {
      const updated = [...players];
      updated[editIndex] = { ...updated[editIndex], ...form };
      setPlayers(updated);
      setEditIndex(null);
    } else {
      const fechaIngreso = new Date().toLocaleDateString();

      setPlayers([...players, { ...form, fechaIngreso, pagos: [] }]);
    }

    setForm({
      nombre: "",
      apellido: "",
      telefono: "",
      correo: "",
      nacimiento: "",
      categoria: "Mini Voley",
      genero: "Damas",
    });
  };

  // EDITAR
  const editarJugador = (index) => {
    setForm(players[index]);
    setEditIndex(index);
  };

  // DAR DE BAJA
  const eliminarJugador = (index) => {
    if (!window.confirm("Dar de baja desde este mes?")) return;

    const updated = [...players];
    updated[index].fechaSalida = mesActual;
    setPlayers(updated);
  };

  // REACTIVAR
  const reactivarJugador = (index) => {
    const updated = [...players];
    delete updated[index].fechaSalida;
    setPlayers(updated);
  };

  // PAGOS
  const togglePago = (index) => {
    const updated = [...players];

    let pago = updated[index].pagos.find((p) => p.mes === mesActual);

    if (pago) {
      pago.estado = pago.estado === "Pagado" ? "Pendiente" : "Pagado";
    } else {
      updated[index].pagos.push({
        mes: mesActual,
        estado: "Pagado",
      });
    }

    setPlayers(updated);
  };

  // RESUMEN
  const mensualidad = 25000;
  let totalPagado = 0;
  let totalPendiente = 0;

  const jugadoresActivos = players.filter((p) => {
    if (!p.fechaSalida) return true;
    return p.fechaSalida > mesActual;
  });

  jugadoresActivos.forEach((p) => {
    const pago = p.pagos.find((x) => x.mes === mesActual);
    const estado = pago ? pago.estado : "Pendiente";

    if (estado === "Pagado") totalPagado += mensualidad;
    else totalPendiente += mensualidad;
  });

  // EXCEL
  const exportarExcel = () => {
    const data = players.map((p) => {
      const pago = p.pagos.find((x) => x.mes === mesActual);
      return {
        Nombre: p.nombre,
        Apellido: p.apellido,
        Categoria: p.categoria,
        Genero: p.genero,
        FechaIngreso: p.fechaIngreso,
        Nacimiento: p.nacimiento,
        Estado: pago ? pago.estado : "Pendiente",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagos");

    XLSX.writeFile(wb, "reporte.xlsx");
  };

  return (
    <div
      style={{
        background: "#0f0f0f",
        color: "white",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img src={logo} style={{ width: 120 }} />
        <h1 style={{ color: "#ff2d2d" }}>Voleibol San Carlos</h1>
      </div>

      {/* MES */}
      <input
        type="month"
        value={mesActual}
        onChange={(e) => setMesActual(e.target.value)}
      />

      {/* RESUMEN */}
      <div>
        💰 {totalPagado} | ❗ {totalPendiente} | 👥 {jugadoresActivos.length}
      </div>

      {/* FORM */}
      <div>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <input
          placeholder="Apellido"
          value={form.apellido}
          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
        />
        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
        <input
          placeholder="Correo"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
        />
        <input
          type="date"
          value={form.nacimiento}
          onChange={(e) => setForm({ ...form, nacimiento: e.target.value })}
        />

        <select
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        >
          <option>Mini Voley</option>
          <option>Sub 14</option>
          <option>Sub 16</option>
          <option>Sub 18</option>
          <option>Todo Competidor</option>
        </select>

        <select onChange={(e) => setForm({ ...form, genero: e.target.value })}>
          <option>Damas</option>
          <option>Varones</option>
        </select>

        <button onClick={guardarJugador}>
          {editIndex !== null ? "Actualizar" : "Agregar"}
        </button>

        <button onClick={exportarExcel}>Excel</button>
      </div>

      <hr />

      {/* LISTA ACTIVOS */}
      <h3>Jugadores Activos</h3>
      {jugadoresActivos.map((p, i) => {
        const pago = p.pagos.find((x) => x.mes === mesActual);
        const estado = pago ? pago.estado : "Pendiente";

        return (
          <div
            key={i}
            style={{ background: "#1c1c1c", padding: 10, margin: 10 }}
          >
            <b>
              {p.nombre} {p.apellido}
            </b>
            <br />
            📞 {p.telefono} <br />
            ✉️ {p.correo} <br />
            🎂 {p.nacimiento} <br />
            📅 Ingreso: {p.fechaIngreso} <br />
            🏐 {p.categoria} - {p.genero} <br />
            💰 Estado: {estado} <br />
            <button onClick={() => togglePago(i)}>Pago</button>
            <button onClick={() => editarJugador(i)}>Editar</button>
            <button onClick={() => eliminarJugador(i)}>Baja</button>
          </div>
        );
      })}

      <hr />

      {/* BAJAS */}
      <h3>Jugadores Dados de Baja</h3>
      {players
        .filter((p) => p.fechaSalida && p.fechaSalida <= mesActual)
        .map((p, i) => (
          <div key={i}>
            {p.nombre} {p.apellido} ❌ {p.fechaSalida}
            <button onClick={() => reactivarJugador(i)}>Reactivar</button>
          </div>
        ))}
    </div>
  );
}
