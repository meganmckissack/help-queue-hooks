import React, { useEffect, useState } from 'react';
import NewTicketForm from './NewTicketForm';
import TicketList from './TicketList';
import EditTicketForm from './EditTicketForm';
import TicketDetail from './TicketDetail';
import { db, auth } from './../firebase.js';
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns'; 
// import { v4 } from 'uuid';
// import { setDoc, doc } from 'firebase/firestore';

function TicketControl()  {
  const [formVisibleOnPage, setFormVisibleOnPage] = useState(false);
  const [mainTicketList, setMainTicketList] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryByTimestamp = query(
      collection(db, "tickets"),
      orderBy('timeOpen')
    );

    const unSubscribe = onSnapshot(
      queryByTimestamp,
      (querySnapshot) => {
        const tickets = [];
        querySnapshot.forEach((doc) => {
          const timeOpen = doc.get('timeOpen', {serverTimestamps: "estimate"}).toDate();
          const jsDate = new Date(timeOpen);
          tickets.push({
            names: doc.data().names,
            location: doc.data().location,
            issue: doc.data().issue,
            timeOpen: jsDate,
            formattedWaitTime: formatDistanceToNow(jsDate),
            // ...doc.data(),  //using the spread operator to do the same as above
            id: doc.id
          });
        });
        setMainTicketList(tickets);
      },
      (error) => {
        setError(error.message);
      }
    );
    return () => unSubscribe();
  }, []);

  useEffect(() => {
    function updateTicketElapsedWaitTime() {
      const newMainTicketList = mainTicketList.map(ticket => {
        const newFormattedWaitTime = formatDistanceToNow(ticket.timeOpen);
        return {...ticket, formattedWaitTime: newFormattedWaitTime};
      });
      setMainTicketList(newMainTicketList);
    }

    const waitTimeUpdateTimer = setInterval(() =>
      updateTicketElapsedWaitTime(), 
      60000
    );

    return function cleanup() {
      clearInterval(waitTimeUpdateTimer);
    }
  }, [mainTicketList])
  

  const handleClick = () => {
    if (selectedTicket != null) {
      setFormVisibleOnPage(false);
      setSelectedTicket(null);
      setEditing(false);
    } else {
      setFormVisibleOnPage(!formVisibleOnPage);
    }
      // this.setState({
      //   formVisibleOnPage: false,
      //   selectedTicket: null,
      //   editing: false
      // });
    // } else {
    //   setFormVisibleOnPage(!formVisibleOnPage);
    //   this.setState(prevState => ({
    //     formVisibleOnPage: !prevState.formVisibleOnPage,
    //   }));
    // }
  }

  const handleDeletingTicket = async(id) => {
    // const newMainTicketList = mainTicketList.filter(ticket => ticket.id !== id);
    // setMainTicketList(newMainTicketList);
    await deleteDoc(doc(db, "tickets", id));
    setSelectedTicket(null);
    // this.setState({
    //   mainTicketList: newMainTicketList,
    //   selectedTicket: null
    // });
  }

  const handleEditClick = () => {
    setEditing(true);
    // this.setState({editing: true});
  }

  const handleEditingTicketInList = async(ticketToEdit) => {
    // const editedMainTicketList = mainTicketList
    //   .filter(ticket => ticket.id !== selectedTicket.id)
    //   .concat(ticketToEdit);
    // setMainTicketList(editedMainTicketList);
    const ticketRef = doc(db, 'tickets', ticketToEdit.id);
    await updateDoc(ticketRef, ticketToEdit);
    setEditing(false);
    setSelectedTicket(null);
    // this.setState({
    //   mainTicketList: editedMainTicketList,
    //   editing: false,
    //   selectedTicket: null
    // });
  }

  const handleAddingNewTicketToList = async (newTicketData) => {
    // await addDoc(collection(db, "tickets"), newTicketData);
    const collectionRef = collection(db, "tickets");
    await addDoc(collectionRef, newTicketData);
    // await setDoc(doc(db, "tickets", v4()), newTicketData);
    setFormVisibleOnPage(false);
    // const newMainTicketList = mainTicketList.concat(newTicket);
    // setMainTicketList(newMainTicketList);
    // this.setState({mainTicketList: newMainTicketList});
    // this.setState({formVisibleOnPage: false});
  }

  const handleChangingSelectedTicket = (id) => {
    const selection = mainTicketList.filter(ticket => ticket.id === id)[0];
    selectedTicket(selection);
    // this.setState({selectedTicket: selectedTicket});
  }

 
  if(auth.currentUser == null) {
    return (
      <React.Fragment>
        <h1>You must be signed in to access the queue.</h1>
      </React.Fragment>
    )
  } else if (auth.currentUser != null) {

    let currentlyVisibleState = null;
    let buttonText = null; 
    
    if (error) {
      currentlyVisibleState = <p>There was and error: {error}</p>
    } else if (editing ) {      
      currentlyVisibleState = 
        <EditTicketForm 
          ticket = {selectedTicket} 
          onEditTicket = {handleEditingTicketInList} />
      buttonText = "Return to Ticket List";
    } else if (selectedTicket != null) {
      currentlyVisibleState = 
      <TicketDetail 
        ticket={selectedTicket} 
        onClickingDelete={handleDeletingTicket}
        onClickingEdit = {handleEditClick} />
      buttonText = "Return to Ticket List";
    } else if (formVisibleOnPage) {
      currentlyVisibleState = 
      <NewTicketForm 
        onNewTicketCreation={handleAddingNewTicketToList}/>;
      buttonText = "Return to Ticket List"; 
    } else {
      currentlyVisibleState = 
        <TicketList 
          onTicketSelection={handleChangingSelectedTicket} 
          ticketList={mainTicketList} />;
      buttonText = "Add Ticket"; 
    }
    return (
      <React.Fragment>
        {currentlyVisibleState}
        {error ? null : <button onClick={handleClick}>{buttonText}</button>}
      </React.Fragment>
    );
  }
}



export default TicketControl;

